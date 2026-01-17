# VLLM-Agent-For-Interior-Design

**VLLM-Agent-For-Interior-Design** is an intelligent, agent-based vision–language system designed to support **end-to-end interior design workflows**. It combines open-source large language models with state-of-the-art image generation models to enable seamless conversational design exploration, ideation, and visualization.

The system allows users to discuss interior design concepts in natural language and generate visual design proposals on demand, making it suitable for designers, architects, and AI researchers experimenting with multimodal agents.

## ✨ Key Features

<img width="2000" height="961" alt="image" src="https://github.com/user-attachments/assets/29e4ecb8-5f46-4e71-8446-73507a1b9849" />

### 🧠 Multi-Agent ReAct Architecture (LangChain)

The system is built on a **multi-agent ReAct (Reason + Act) framework** using **LangChain**, enabling agents to explicitly reason about problems, decide on actions, and coordinate with each other. Each agent specializes in a specific task (design reasoning, retrieval, image generation, tool orchestration), resulting in more accurate, interpretable, and scalable decision-making workflows.

---

### 🔌 Model Context Protocol (MCP) Servers with FastMCP

Agentic tools are exposed via **Model Context Protocol (MCP)** servers implemented using **FastMCP**. This allows tools (retrieval, image generation, memory, etc.) to be dynamically discovered and invoked by agents in a standardized way, ensuring clean separation between reasoning and execution while making the system easy to extend.

---

### 📚 Retrieval Augmented Generation (RAG) with Pinecone

The assistant uses **Pinecone** as a vector database to support **semantic search and long-term memory**. Design references, style guides, prior conversations, and user preferences are embedded and retrieved using vector similarity search, enabling:

* Context-aware recommendations
* Consistency across long conversations
* Reduced hallucinations through grounded responses

---

### 💬 Conversational Interior Design Assistant

A natural, text-based conversational interface allows users to:

* Discuss room types, layouts, budgets, and constraints
* Explore design styles, materials, and color palettes
* Iteratively refine ideas through follow-up questions
  The assistant maintains context across turns, enabling fluid, human-like design discussions.

---

### ⚡ High-Speed Text-to-Text Reasoning (Groq)

The system uses the **GPT-OSS model via the Groq API** for ultra-low-latency reasoning and generation. This ensures:

* Fast response times for interactive design sessions
* High-quality reasoning for complex design constraints
* Efficient handling of multi-step agent workflows

---

### 🎨 Text-to-Image Interior Design Generation

Interior visuals are generated using **FLUX Schnell Diffusion** through the **Pixazo API**. From textual descriptions, the system can produce:

* Concept renders of rooms and interiors
* Visual style explorations (modern, minimalist, rustic, etc.)
* Layout and mood references to support decision-making

---

### 🧩 Modular Agent-Based System Design

The architecture follows a **VLLM-style agentic design**, where each capability is encapsulated as an independent module. This makes it easy to:

* Add new tools or agents
* Swap models or APIs
* Introduce new workflows (e.g., cost estimation, furniture sourcing)

---

### 🌐 Web-Based User Interface

A lightweight **local web application** provides real-time interaction with the assistant. The interface supports conversational input, visual output, and smooth iteration, making it suitable for rapid experimentation and practical use.

---

### 🚀 Extensible & Production-Ready Foundation

The combination of MCP, RAG, multi-agent reasoning, and modular design makes this project a strong foundation for:

* Advanced AI design assistants
* Agentic AI research and experimentation
* Scalable production deployments


## 🧱 System Architecture (High-Level)

* **Frontend**: Web-based UI for chat and image display
* **Backend**: Node.js server orchestrating agent logic
* **LLM Provider**: GPT-OSS via Groq API
* **Image Generation**: FLUX Schnell Diffusion via Pixazo API

---

## 🚀 Getting Started

### 1. Clone the Repository

In your terminal, run:

```bash
git clone git@github.com:tengjieksee/VLLM-Agent-For-Interior-Design.git
```

### 2. Install Dependencies

Navigate to the project directory and install dependencies:

```bash
cd VLLM-Agent-For-Interior-Design
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root and add your API keys:

```env
GROQ_API_KEY=<your_groq_api_key>
PIXAZO_API_KEY=<your_pixazo_api_key>
```

You can obtain API keys from:

* Groq: [https://groq.com/](https://groq.com/)
* Pixazo: [https://www.pixazo.ai](https://www.pixazo.ai)

### 4. Launch the Web Application

Start the server with:

```bash
node server.js
```

Then open your browser and go to:

```
http://localhost:3000
```

### 5. Interact with the Agent

* Type natural language queries to discuss interior design ideas
* Ask the agent **explicitly** to generate images when you want visual design concepts (e.g., floor plans, room styles, layouts)

---

## 🖼 Example Usage

Below are example screenshots demonstrating conversational interaction and generated interior design visuals:

![Example 1](https://github.com/user-attachments/assets/5942cdc6-7fcb-41e9-96cd-bd0c071b17bf)

![Example 2](https://github.com/user-attachments/assets/9ebc1a23-4de1-4883-9b33-5a7d9a1ffff0)

---

## 🛠️ Extensibility

This project is designed to be easily extended:

* Swap in alternative LLMs or diffusion models
* Add memory, planning, or tool-using agents
* Integrate CAD tools, 3D rendering, or cost estimation modules

---

## 📄 License

This project is open-source. Please check the repository for license details.

---

## 🙌 Acknowledgements

* Groq for high-performance LLM inference
* Pixazo for diffusion-based image generation
* Open-source VLLM and agent research communities
