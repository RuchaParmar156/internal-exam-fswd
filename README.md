# Image Compression Web App

A web application that allows users to upload images, compress them, and store their details in MongoDB. The app features a beautiful gradient UI and provides compression information for each uploaded image.

## Features

- Upload images from the browser
- Automatic image compression
- MongoDB storage for image details (even-numbered IDs only)
- Display list of uploaded images with compression info
- Download compressed images
- Beautiful gradient UI with blue and purple theme

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (with MongoDB Compass)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `public/uploads` directory:
   ```bash
   mkdir -p public/uploads
   ```
4. Start MongoDB service
5. Start the application:
   ```bash
   npm start
   ```
6. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Click on the upload area or drag and drop an image
2. Wait for the compression process to complete
3. View the compression details and download the compressed image
4. Images with even-numbered IDs will be stored in MongoDB

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Sharp (for image compression)
- Multer (for file upload)
- HTML5/CSS3
- JavaScript (ES6+) 