from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from rest_framework.parsers import MultiPartParser, FormParser
from .models import ChatHistory, Document
from .serializers import ChatHistorySerializer, QARequestSerializer, DocumentSerializer
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.text_splitter import CharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
import os
from dotenv import load_dotenv

load_dotenv()




class RegisterUserView(APIView):
	"""API endpoint for user registration."""
	permission_classes = [permissions.AllowAny]

	def post(self, request):
		username = request.data.get('username')
		password = request.data.get('password')
		if not username or not password:
			return Response({'error': 'Username and password required.'}, status=status.HTTP_400_BAD_REQUEST)
		if User.objects.filter(username=username).exists():
			return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)
		user = User.objects.create_user(username=username, password=password)
		token, _ = Token.objects.get_or_create(user=user)
		return Response({'token': token.key}, status=status.HTTP_201_CREATED)



class LoginUserView(APIView):
	
	permission_classes = [permissions.AllowAny]

	def post(self, request):
		username = request.data.get('username')
		password = request.data.get('password')
		user = authenticate(username=username, password=password)
		if user:
			token, _ = Token.objects.get_or_create(user=user)
			return Response({'token': token.key}, status=status.HTTP_200_OK)
		return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

# List chat history for a user

class ChatHistoryListView(generics.ListAPIView):
	"""API endpoint to list chat history for a user."""
	serializer_class = ChatHistorySerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		user = self.request.user
		document_id = self.request.query_params.get('document_id')
		queryset = ChatHistory.objects.filter(user=user)
		if document_id:
			queryset = queryset.filter(document_id=document_id)
		return queryset.order_by('-created_at')







class QAView(APIView):
	"""API endpoint for document-based question answering using LangChain."""
	permission_classes = [permissions.IsAuthenticated]
	def post(self, request, format=None):
		import asyncio
		try:
			asyncio.get_running_loop()
		except RuntimeError:
			asyncio.set_event_loop(asyncio.new_event_loop())
		
		serializer = QARequestSerializer(data=request.data)
		if serializer.is_valid():
			doc_id = serializer.validated_data.get('document_id', None)
			question = serializer.validated_data['question']
			history_text = ""
			document = None
			if doc_id:
				try:
					document = Document.objects.get(id=doc_id)
				except Document.DoesNotExist:
					document = None
				if document:
					# Load FAISS vectorstore
					api_key = os.getenv("GEMINI_API_KEY")
					embeddings = GoogleGenerativeAIEmbeddings(
						google_api_key=api_key,
						model="models/embedding-001"
					)
					vectorstore = FAISS.load_local(
						document.faiss_index_path,
						embeddings,
						allow_dangerous_deserialization=True
					)
					retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
					# Get top chunks
					context_chunks = retriever.invoke(question)
					context = "\n---\n".join([chunk.page_content for chunk in context_chunks])
					# Get recent chat history
					max_history = 5
					recent_history = ChatHistory.objects.filter(document_id=doc_id).order_by('-created_at')[:max_history]
					for chat in reversed(recent_history):
						history_text += f"Q: {chat.question}\nA: {chat.answer}\n"
					# Build prompt
					prompt = (
						"You are an expert Q&A assistant. Only answer questions using the provided Document Context below. "
						"If the answer is not present in the context, reply: 'Sorry, this information is not found in the uploaded document. Please upload a relevant text document.' "
						"Do not use any outside knowledge.\n"
						f"Document Context:\n{context}\n\nChat History:\n{history_text}\n\nCurrent Question: {question}\n\nAnswer:"
					)
					# Use Gemini LLM via LangChain
					llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)
					response = llm.invoke(prompt)
					# Extract answer text if response is a list of tuples
					if isinstance(response, list):
						# Try to find the tuple with key 'content'
						answer = None
						for item in response:
							if isinstance(item, (list, tuple)) and item[0] == "content":
								answer = item[1]
								break
						if answer is None:
							answer = str(response)
					elif hasattr(response, 'content'):
						answer = response.content
					elif isinstance(response, str) and response.startswith("content="):
						# Extract text after 'content=' and before any other key
						answer = response.split("content=")[1].split("additional_kwargs")[0].strip().strip('"')
					else:
						answer = str(response)
					# Save chat history only if document exists
					ChatHistory.objects.create(user=request.user, document=document, question=question, answer=answer)
					return Response({'answer': answer}, status=status.HTTP_200_OK)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





def extract_text_from_file(file_obj, filename):
	
	import tempfile
	ext = filename.lower().split('.')[-1]
	try:
		if ext == 'pdf':
			import pdfplumber
			with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
				tmp.write(file_obj.read())
				tmp_path = tmp.name
			text = ''
			try:
				with pdfplumber.open(tmp_path) as pdf:
					for page in pdf.pages:
						page_text = page.extract_text()
						if page_text:
							text += page_text + '\n'
			except Exception as e:
				print(f"[ERROR] pdfplumber failed to parse PDF: {filename}. Exception: {e}")
				text = ''
			finally:
				os.remove(tmp_path)
			if not text:
				print(f"[WARNING] No text extracted from PDF: {filename}")
			return text
		elif ext == 'docx':
			try:
				import docx
				doc = docx.Document(file_obj)
				text = '\n'.join([para.text for para in doc.paragraphs])
				if not text:
					print(f"[WARNING] No text extracted from DOCX: {filename}")
				return text
			except Exception as e:
				print(f"[ERROR] python-docx failed to parse DOCX: {filename}. Exception: {e}")
				return ''
		elif ext == 'txt':
			try:
				text = file_obj.read().decode('utf-8')
				if not text:
					print(f"[WARNING] No text extracted from TXT: {filename}")
				return text
			except Exception as e:
				print(f"[ERROR] Failed to parse TXT: {filename}. Exception: {e}")
				return ''
		else:
			print(f"[ERROR] Unsupported file type: {filename}")
			return ''
	except Exception as e:
		print(f"[CRITICAL] Unexpected error parsing file {filename}: {e}")
		return ''





class DocumentUploadView(APIView):
	permission_classes = [permissions.IsAuthenticated]
	parser_classes = (MultiPartParser, FormParser)

	def post(self, request, format=None):
		import asyncio
		try:
			asyncio.get_running_loop()
		except RuntimeError:
			asyncio.set_event_loop(asyncio.new_event_loop())
		
		serializer = DocumentSerializer(data=request.data)
		if serializer.is_valid():
			file_obj = request.FILES.get('file')
			filename = file_obj.name if file_obj else ''
			text = extract_text_from_file(file_obj, filename)
			doc = serializer.save(text_content=text)
			# LangChain chunking
			splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
			chunks = splitter.split_text(text)
			# LangChain Gemini embeddings
			api_key = os.getenv("GEMINI_API_KEY")
			embeddings = GoogleGenerativeAIEmbeddings(
				google_api_key=api_key,
				model="models/embedding-001"
			)
			# Create FAISS vectorstore
			vectorstore = FAISS.from_texts(chunks, embeddings)
			index_path = f"faiss_indexes/document_{doc.id}.index"
			os.makedirs(os.path.dirname(index_path), exist_ok=True)
			vectorstore.save_local(index_path)
			# Update document with index path and chunks
			doc.faiss_index_path = index_path
			doc.chunks = chunks
			doc.save()
			return Response(DocumentSerializer(doc).data, status=status.HTTP_201_CREATED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

