import express from "express";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from "@prisma/client";
import { uploads } from "./config/multer.js";
import { generateImageUrl } from "./utils/product.js";
import { promises as fs } from "fs";
import { validationResult } from "express-validator";

const prisma = new PrismaClient();

const product_id = uuidv4();
const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/api/products", async (req, res) => {
  const products = await prisma.product.findMany();
  return res.json(products);
});

app.post("/api/products", uploads.single("image"), async (req, res) => {
  const { name } = req.body;
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  try {
    const image = generateImageUrl(req, req.file.filename);
    const product = await prisma.product.create({
      data: {
        product_id,
        name,
        slug,
        image,
      },
    });
    return res.status(201).json(product);
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path);
    }
    return res.status(500).json({ error: error.message });
  }
});

app.put("/api/products/:id", uploads.single("image"), async (req, res) => {
  try {
    // Validasi input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = parseInt(req.params.id);
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    // Cek apakah produk dengan slug sudah ada
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });
    if (existingProduct && existingProduct.id !== id) {
      throw new Error("Product slug must be unique");
    }

    // Dapatkan produk yang akan diperbarui
    const product = await prisma.product.findUnique({
      where: { id },
    });

    // Pastikan produk ditemukan
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Persiapkan data untuk update
    const data = { name, slug };
    if (req.file) {
      // Hapus gambar lama jika ada
      await fs.unlink(`public/images/${product.image.split("/").pop()}`);
      data.image = generateImageUrl(req, req.file.filename);
    }

    // Lakukan update produk
    const updatedProduct = await prisma.product.update({
      where: { id },
      data,
    });

    return res.json(updatedProduct);
  } catch (error) {
    // Tangani kesalahan
    if (req.file) {
      // Hapus file yang diunggah jika ada kesalahan
      await fs.unlink(req.file.path);
    }
    return res.status(500).json({ error: error.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    // cek ketersediaan
    const id = parseInt(req.params.id);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // delete image
    await fs.unlink(`public/images/${product.image.split("/").pop()}`);

    // delete
    const deletedProduct = await prisma.product.delete({ where: { id } });
    return res.json(deletedProduct);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => {
  console.log("run on port 5000...");
});
