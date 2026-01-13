# VLLM-Agent-For-Interior-Design

**VLLM-Agent-For-Interior-Design** is an intelligent, agent-based vision–language system designed to support **end-to-end interior design workflows**. It combines open-source large language models with state-of-the-art image generation models to enable seamless conversational design exploration, ideation, and visualization.

The system allows users to discuss interior design concepts in natural language and generate visual design proposals on demand, making it suitable for designers, architects, and AI researchers experimenting with multimodal agents.

---

## ✨ Key Features

* **Conversational Design Assistant**
  Natural, context-aware text-based interaction for discussing interior design ideas, requirements, and constraints.

* **Text-to-Text Reasoning via Groq**
  Uses the **GPT-OSS model** through the **Groq API** for fast and high-quality language understanding and generation.

* **Text-to-Image Interior Design Generation**
  Leverages **FLUX Schnell Diffusion** via the **Pixazo API** to generate interior design images, layouts, and visual concepts.

* **Agent-Based Architecture**
  Designed as a modular VLLM agent system, making it easy to extend with additional tools, models, or workflows.

* **Web-Based Interface**
  Simple local web app for interacting with the agent in real time.

---

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
