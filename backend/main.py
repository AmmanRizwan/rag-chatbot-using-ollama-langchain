from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, AsyncGenerator
import uvicorn
from dotenv import load_dotenv
import os
import PyPDF2
from io import BytesIO
import json
import asyncio

load_dotenv()

# LangChain imports
from langchain_ollama import OllamaLLM, OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import CharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_community.tools import DuckDuckGoSearchRun
from langchain.agents import Tool

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = os.environ.get("MODEL_NAME")

# Example documents for demonstration
DOCUMENTS = [
	{"text": "LangChain is a framework for developing applications powered by language models."},
	{"text": "OpenAI developed GPT (Generative Pre-trained Transformer) models, including GPT-3 and GPT-4."},
	{"text": "FAISS is a library for efficient similarity search and clustering of dense vectors."},
	{"text": "nomic-embed-text is an embedding model for text data."},
]

# Function to extract text from PDF
def extract_text_from_pdf(file_bytes):
    pdf_reader = PyPDF2.PdfReader(BytesIO(file_bytes))
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    return text

# Function to process and add documents to vector store
def process_and_add_documents(texts):
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len)
    docs = text_splitter.create_documents(texts)
    return docs

# Initialize embedding model
embedding_model = OllamaEmbeddings(model="nomic-embed-text:latest")

# Initialize vector store with example documents
texts = [doc["text"] for doc in DOCUMENTS]
docs = process_and_add_documents(texts)
vectorstore = Chroma.from_documents(docs, embedding_model)

# Initialize LLM with streaming
llm = OllamaLLM(model=MODEL_NAME, streaming=True)

# Prompt template for RAG
# Prompt template for RAG
prompt_template = PromptTemplate(
	input_variables=["context", "question"],
	template="""
You are an AI assistant that helps the user by answering questions based on the given context.  

### Rules:
- First, try to answer using the provided **context**.
- The context includes both pre-loaded documents and any additional PDF documents that users have uploaded.
- If you find information from uploaded documents, indicate this in your response.
- If the user's question is unrelated to the context, respond that you will search externally (via the DuckDuckGo search engine).
- Always explain answers clearly and concisely.
- Format your response in **Markdown**:
  - Start with a level 2 heading (##) summarizing the response
  - Use bullet points (*) or numbered lists (1.) for steps
  - Use bold (**text**) or italic (*text*) for emphasis
  - Use backticks (`code`) for inline code
  - Use fenced code blocks (```language) for multi-line code
  - Use > for quotes or important notes
  - Use --- for horizontal rules to separate sections
  - Use proper markdown links [text](url) for URLs
- If you cannot find an answer even with external search, state this honestly instead of making up information.

Context:
{context}

Question: {question}
Answer (in markdown):
"""
)

# Add DuckDuckGo internet search tool
search_tool = DuckDuckGoSearchRun()

# Define a tool for the agent
tools = [
	Tool(
		name="DuckDuckGo Search",
		func=search_tool.run,
		description="Useful for when you need to answer questions about current events or information not in the provided context."
	)
]

# Optionally, you can initialize an agent that uses both RAG and search (not used directly in the RetrievalQA chain above)
# agent = initialize_agent(
#     tools, llm, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION, verbose=True
# )

# RetrievalQA chain
qa_chain = RetrievalQA.from_chain_type(
	llm=llm,
	chain_type="stuff",
	retriever=vectorstore.as_retriever(),
	return_source_documents=True,
	chain_type_kwargs={"prompt": prompt_template}
)

class ChatRequest(BaseModel):
	question: str

class ChatResponse(BaseModel):
	answer: str
	sources: List[str]

class UploadResponse(BaseModel):
    message: str
    document_count: int

@app.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        return {"message": "Only PDF files are supported", "document_count": 0}
    
    contents = await file.read()
    text = extract_text_from_pdf(contents)
    
    # Process and add the new document
    new_docs = process_and_add_documents([text])
    vectorstore.add_documents(new_docs)
    
    return {
        "message": f"Successfully processed and added {file.filename}",
        "document_count": len(new_docs)
    }

@app.get("/")
def index():
  return {"message": "LLM is running"}

@app.get("/health")
def health_check():
  return {"status": "healthy", "message": "Backend service is running"}

async def format_sse(data: str, event: str = None) -> str:
    """Format data into SSE format"""
    message = f"data: {json.dumps(data)}\n\n"
    if event is not None:
        message = f"event: {event}\n{message}"
    return message

async def generate_stream(question: str) -> AsyncGenerator[str, None]:
    """Generate streaming response"""
    # Get relevant documents with scores
    docs_and_scores = vectorstore.similarity_search_with_score(question)
    
    # Separate docs and scores
    docs = [doc for doc, _ in docs_and_scores]
    scores = [score for _, score in docs_and_scores] if docs_and_scores else [0]
    
    # Initialize context and sources
    context_parts = []
    sources = []
    
    # Add vector store results if relevant
    if docs and scores[0] >= 0.7:  # Threshold of 0.7 (adjust as needed)
        vector_store_context = "\n".join([doc.page_content for doc in docs])
        context_parts.append("Information from local documents:\n" + vector_store_context)
        sources.extend([doc.page_content for doc in docs])
    
    # Always perform web search for complementary information
    try:
        print("Performing web search...")
        web_search_result = search_tool.run(question)
        if web_search_result.strip():
            context_parts.append("Information from web search:\n" + web_search_result)
            sources.append(f"Web Search Results: {web_search_result}")
    except Exception as e:
        print(f"Web search failed: {e}")
    
    # Combine all context
    if context_parts:
        context = "\n\n---\n\n".join(context_parts)
    else:
        context = "No relevant information found in local documents or web search."
    
    # Create a more specific prompt that handles both sources
    combined_prompt = f"""
Based on the following information sources, answer the user's question.
If using information from web search, explicitly mention that the information comes from the web.
If using information from local documents, mention that as well.
If you find conflicting information between sources, acknowledge this and explain the differences.

{context}

User Question: {question}
Answer (please format in markdown):
"""
    
    # Stream the response
    response_tokens = []
    async for chunk in llm.astream(combined_prompt):
        yield await format_sse({
            "type": "token",
            "content": chunk
        }, event="token")
    
    # Send the sources
    yield await format_sse({
        "type": "sources",
        "content": sources
    }, event="sources")
    
    # Send a done signal
    yield await format_sse({
        "type": "done"
    }, event="done")

@app.post("/chat")
async def chat(request: ChatRequest):
    return StreamingResponse(
        generate_stream(request.question),
        media_type="text/event-stream"
    )

@app.get("/health")
def health_check():
  return {"status": "healthy", "message": "Backend service is running"}

if __name__ == "__main__":
	uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
