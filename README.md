# AI RAG Chatbot using Ollama & LangChain

A sophisticated Retrieval-Augmented Generation (RAG) chatbot that combines local document processing with web search capabilities. Built with FastAPI backend and React TypeScript frontend.

## Features

- **RAG Implementation**: Process and query local documents using vector similarity search
- **PDF Document Upload**: Extract and process text from PDF documents
- **Web Search Integration**: Uses DuckDuckGo for real-time information retrieval
- **Streaming Responses**: Real-time streaming chat responses using Server-Sent Events (SSE)
- **Hybrid Information Sources**: Combines local document knowledge with web search results
- **Modern UI**: React TypeScript frontend with Tailwind CSS styling
- **Markdown Support**: Full markdown rendering for rich text responses

## Architecture

### Backend (Python FastAPI)
- **Vector Store**: ChromaDB for document embeddings and similarity search
- **Embeddings**: Ollama's `nomic-embed-text` model for text embeddings
- **LLM**: Configurable Ollama model (default: `gemma2:2b`)
- **Document Processing**: PyPDF2 for PDF text extraction
- **Text Splitting**: LangChain's CharacterTextSplitter for document chunking
- **Web Search**: DuckDuckGo integration for external information

### Frontend (React TypeScript)
- **Real-time Chat**: Server-Sent Events for streaming responses
- **File Upload**: Drag-and-drop PDF document upload
- **Markdown Rendering**: Rich text display with react-markdown
- **Modern UI**: Tailwind CSS with custom components

## Algorithm Overview

The chatbot follows this intelligent workflow:

1. **Document Processing**:
   - PDFs are uploaded and text is extracted using PyPDF2
   - Text is chunked into manageable pieces (1000 chars, 200 overlap)
   - Chunks are embedded using `nomic-embed-text` and stored in ChromaDB

2. **Query Processing**:
   - User questions are embedded and compared against document vectors
   - Similarity search retrieves relevant document chunks (threshold: 0.7)
   - Web search is performed for complementary information

3. **Response Generation**:
   - Context is built from both local documents and web search results
   - Custom prompt template guides the LLM to cite sources appropriately
   - Response is streamed back to the user with source attribution

4. **Source Attribution**:
   - Clearly indicates information from uploaded documents vs. web search
   - Displays conflicting information when sources disagree
   - Provides transparency about information sources

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- [Ollama](https://ollama.ai/) installed and running

### Backend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd rag-chatbot-using-ollama-langchain
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Pull the required Ollama models:
```bash
ollama pull gemma2:2b
ollama pull nomic-embed-text
```

### Frontend Setup

1. Navigate to the chat directory:
```bash
cd chat
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env if using Supabase features
```

## Usage

### Start the Backend Server

```bash
# From the root directory
python main.py
```

The API will be available at `http://localhost:8000`

### Start the Frontend

```bash
# From the chat directory
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### POST `/upload`
Upload and process PDF documents.

**Request**: Multipart form data with PDF file
**Response**: 
```json
{
  "message": "Successfully processed and added filename.pdf",
  "document_count": 5
}
```

### POST `/chat`
Send a question and receive streaming response.

**Request**:
```json
{
  "question": "What is LangChain?"
}
```

**Response**: Server-Sent Events stream with:
- `token` events: Streaming response tokens
- `sources` events: Source attribution
- `done` event: End of response

### GET `/`
Health check endpoint.

## Configuration

### Environment Variables

**Root `.env`**:
```env
MODEL_NAME=gemma2:2b
PORT=8000
```

**Chat `.env`**:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_key
```

### Model Configuration

You can change the Ollama model by updating the `MODEL_NAME` in your `.env` file:
- `gemma2:2b` (lightweight, fast)
- `llama3:8b` (more capable, slower)
- `mistral:7b` (balanced performance)

## Dependencies

### Backend
- `fastapi`: Web framework
- `uvicorn`: ASGI server
- `langchain-ollama`: Ollama integration
- `langchain-community`: Community tools and integrations
- `chromadb`: Vector database
- `pypdf2`: PDF processing
- `python-dotenv`: Environment management

### Frontend
- `react`: UI framework
- `typescript`: Type safety
- `vite`: Build tool
- `tailwindcss`: Styling
- `react-markdown`: Markdown rendering
- `lucide-react`: Icons

## Project Structure

```
├── main.py                 # FastAPI backend server
├── requirements.txt        # Python dependencies
├── .env                   # Backend environment variables
├── README.md              # Project documentation
└── chat/                  # React frontend
    ├── src/
    │   ├── components/    # React components
    │   ├── hooks/        # Custom React hooks
    │   ├── lib/          # Utility functions
    │   └── App.tsx       # Main application
    ├── package.json      # Node.js dependencies
    └── vite.config.ts    # Vite configuration
```

## Features in Detail

### Intelligent Source Combination
The system intelligently combines information from multiple sources:
- **Local Documents**: High relevance threshold (0.7) ensures quality matches
- **Web Search**: Always performed for current/complementary information
- **Conflict Resolution**: Acknowledges and explains source disagreements

### Streaming Responses
Real-time response streaming provides:
- Immediate feedback to users
- Better user experience for long responses
- Source attribution after response completion

### Document Processing Pipeline
Robust document handling:
- PDF text extraction with error handling
- Intelligent text chunking (1000 chars, 200 overlap)
- Vector embedding and storage
- Efficient similarity search

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Ollama](https://ollama.ai/) for local LLM hosting
- [LangChain](https://langchain.com/) for RAG framework
- [ChromaDB](https://www.trychroma.com/) for vector storage
- [DuckDuckGo](https://duckduckgo.com/) for web search API

