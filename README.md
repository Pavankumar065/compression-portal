# **Compression Portal**

This web-based application offers versatile file compression and decompression. It showcases custom implementations of lossless algorithms like Run-Length Encoding (RLE) and Huffman Coding, alongside the industry-standard Gzip algorithm (powered by Node.js's zlib). The portal provides an interactive platform to explore compression techniques and compare their performance against a robust solution, making complex concepts accessible.

## **Deployed Demo Link**

Access the live, deployed Compression Portal here:

👉 [**https://my-compression-portal-app-pavan.onrender.com/**](https://my-compression-portal-app-pavan.onrender.com/) 👈

## **Project Overview and Steps to Produce Results**

The Compression Portal simplifies file compression exploration:

1. **Upload File:** Select any local file. The portal displays its name and size.  
2. **Select Algorithm:** Choose from Gzip (general-purpose), Huffman Coding (text/uneven frequencies), or RLE (highly repetitive data).  
3. **Process File:** Click "Start Compression" or "Start Decompression" (for portal-compressed files only).  
4. **Review Results:** View output file name, original/compressed/decompressed size, compression ratio (for compression), and processing time.  
5. **Download Result:** Save the processed file to verify integrity.

This feedback loop helps users understand algorithm effectiveness for different data types.

## **Features**

* **Comprehensive File Handling:** Easily upload and download various file types (text, images, PDFs, binary data). This full workflow ensures integrity verification.  
* **Diverse Lossless Algorithms:**  
  * **Run-Length Encoding (RLE):** Ideal for data with long identical byte sequences (e.g., simple graphics). Compresses by storing byte and count.  
  * **Huffman Coding:** A statistical method assigning shorter codes to frequent characters. Efficient for text files with uneven character frequencies.  
  * **Gzip (DEFLATE):** A robust, widely compatible method using a hybrid of dictionary-based matching and Huffman coding. Provides efficient compression for most general data types.  
* **Detailed Metrics:** Provides original/compressed sizes, compression ratio, and processing time to evaluate algorithm performance.  
* **Algorithm Information:** The portal provides detailed descriptions and explanations of each compression algorithm used, helping users understand their underlying principles and ideal use cases.  
* **Intuitive Navigation:** Includes "Home" and "Compressor" buttons for easy navigation, alongside a "Theme Changer" for a personalized light/dark mode experience.  
* **Theme Changer:** Seamlessly switch between light and dark modes for a personalized viewing experience, enhancing readability and user comfort.

## **Tech Stack Used**

The Compression Portal utilizes a modern JavaScript ecosystem:

* **Frontend:**  
  * **React.js:** For dynamic, interactive user interfaces and component-based development.  
  * **Tailwind CSS:** A utility-first CSS framework for rapid, responsive UI styling.  
  * **Axios:** A promise-based HTTP client for streamlined backend API requests.  
* **Backend:**  
  * **Node.js:** Server-side JavaScript runtime for core file operations and algorithm execution.  
  * **Express.js:** Minimalist Node.js framework for defining API endpoints and handling requests.  
  * **Multer:** Middleware for robust multipart/form-data file uploads.  
  * **path (Node.js):** Utilities for cross-platform file path manipulation.  
  * **fs (Node.js):** Core module for file system interactions (reading, writing).  
  * **zlib (Node.js):** Built-in module providing efficient Gzip/Deflate compression functionalities.

## **Setup Instructions to Run the Project Locally (for Windows)**

To run the Compression Portal locally on Windows, ensure Node.js, npm, and Git are installed.

### **1\. Clone the Repository**

git clone https://github.com/Pavankumar065/compression-portal.git  
cd compression-portal

### **2\. Backend Setup**

1. **Navigate:** cd backend  
2. **Clean (Optional):** rmdir /s /q node\_modules & del package-lock.json  
3. **Install Dependencies:** npm install  
4. **Start Server:** npm start (Runs on http://localhost:5000)

### **3\. Frontend Setup**

1. **Navigate:** cd ..\\frontend  
2. **Clean (Optional):** rmdir /s /q node\_modules, del package-lock.json, rmdir /s /q build  
3. **Create .env:** In frontend/, create .env with REACT\_APP\_API\_BASE\_URL=  
4. **Install Dependencies:** npm install  
5. **Start Server:** npm start (Opens at http://localhost:3000)

### **4\. Usage**

The Compression Portal can be accessed in two ways:

1. **Local Access:** If you've followed the local setup instructions, access the application in your browser at: http://localhost:3000.  
2. **Deployed Demo:** Access the live, deployed version of the application at: **https://my-compression-portal-app-pavan.onrender.com/**.

Once accessed:

* **Upload:** Select a file.  
* **Select Algorithm:** Choose from the dropdown.  
* **Process:** Click "Start Compression" or "Start Decompression".  
* **Review & Download:** Examine metrics and download the result.

**Important Notes:**

* Custom RLE/Huffman compressed files are proprietary; decompress them *only* with this portal using the same algorithm.  
* Lossless algorithms (RLE, Huffman) may not significantly reduce sizes for already compressed image formats (JPEG, PNG), and might even increase them due to overhead. Gzip is generally more effective for diverse file types.  
* Files are named with \_algorithm\_compressed or \_gz suffixes for compressed files, and \_decompressed for restored files.

## **Deployment to Render (Free Tier)**

This project can be easily deployed to Render, a cloud platform that offers a generous free tier for both web services (backend) and static sites (frontend).

**Pre-Deployment Checklist:**

1. **GitHub Repository:** Ensure your entire compression-portal project is pushed to a public GitHub repository. This is essential as Render pulls directly from Git.  
2. **package.json Scripts:** Confirm start and build scripts are correctly defined in backend/package.json and frontend/package.json respectively.  
3. **Frontend API URL:** Verify frontend/src/components/CompressionControls.js uses process.env.REACT\_APP\_API\_BASE\_URL || 'http://localhost:5000'.  
4. **Local .env:** Ensure frontend/.env is in frontend/.gitignore and is left empty locally for deployment.

**Deployment Steps:**

1. **Sign Up / Log In to Render:** Go to [https://render.com/](https://render.com/) and sign up or log in using your GitHub account.  
2. **Deploy Your Backend (Node.js Express Server):**  
   * In the Render Dashboard, click **"New" \-\> "Web Service"**.  
   * **Connect your compression-portal GitHub repository.**  
   * **Configuration:**  
     * **Root Directory:** backend/  
     * **Name:** Choose a unique name (e.g., my-compression-api-yourname).  
     * **Runtime:** Node.js  
     * **Build Command:** npm install  
     * **Start Command:** npm start  
     * **Instance Type:** Select **"Free"**.  
     * **Environment Variables:** Add a new variable:  
       * **Key:** FRONTEND\_URL  
       * **Value:** https://my-compression-portal-app-pavan.onrender.com (Your deployed frontend URL).  
   * Click **"Create Web Service"**.  
   * **Crucial:** Once deployed (status "Live"), **copy this backend URL** (e.g., https://my-compression-api-yourname.onrender.com). You will need it for the frontend.  
3. **Deploy Your Frontend (React Static Site):**  
   * In the Render Dashboard, click **"New" \-\> "Static Site"**.  
   * **Connect your compression-portal GitHub repository.**  
   * **Configuration:**  
     * **Root Directory:** frontend/  
     * **Name:** Choose a unique name (e.g., my-compression-portal-yourname).  
     * **Build Command:** npm run build  
     * **Publish Directory:** build  
     * **Environment Variables:** Add a new variable:  
       * **Key:** REACT\_APP\_API\_BASE\_URL  
       * **Value:** The **exact backend URL** you copied in the previous step (e.g., https://my-compression-api-yourname.onrender.com).  
   * Click **"Create Static Site"**.

**Post-Deployment Testing:**

1. Once both services are "Live" on Render, open your frontend's public URL (https://my-compression-portal-app-pavan.onrender.com/) in a **new Incognito/Private browser window** to avoid caching issues.  
2. Test all compression and decompression functionalities thoroughly.

## 

## **Deployed Demo Link**

Access the live, deployed Compression Portal here:

👉 [**https://my-compression-portal-app-pavan.onrender.com/**](https://my-compression-portal-app-pavan.onrender.com/) 👈