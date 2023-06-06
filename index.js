// Gerekli modülleri içe aktarın
const express = require("express");
const jwt = require("jsonwebtoken");
var cors = require("cors");
const fs = require("fs");

//building express
const app = express();

app.use(cors());
app.use(express.json());

// JWT Secret Key
const jwtSecretKey = "s3cr3tk3y";

// login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Kullanıcı adı ve şifre kontrolü
  if (username === "user" && password === "user123") {
    // JWT oluşturma
    const token = jwt.sign({ username }, jwtSecretKey);

    // Başarılı yanıt
    res.json({ success: true, token });
  } else {
    // Başarısız yanıt
    res
      .status(401)
      .json({ success: false, message: "Geçersiz kullanıcı adı veya şifre" });
  }
});

// product listing endpoint
app.get("/products", authenticateToken, (req, res) => {
  fs.readFile("products.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Ürünler alınamadı" });
    } else {
      const products = JSON.parse(data);
      res.json({ success: true, data: products });
    }
  });
});

//checking token on clientside
app.get("/api/checkToken", authenticateToken, (req, res) => {
  res.json({ success: true, message: "Geçerli token" });
});

// Logout endpoint
app.post("/logout", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    const decoded = jwt.decode(token);
    res.json({ success: true, message: "logged out" });
  } else {
    res.json({ success: false, message: "token doesnt find" });
  }
});

// JWT verification process
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, jwtSecretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// product details endpoint
app.get("/product-details",authenticateToken, (req, res) => {
  const productId = req.query.id;

  fs.readFile("product-details.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: "Ürün detayları alınamadı" });
    } else {
      const productDetails = JSON.parse(data);
      const product = productDetails.find(
        (item) => item.id === Number(productId)
      );

      if (product) {
        res.json({ success: true, data: product });
      } else {
        res.status(404).json({
          success: false,
          message: "Belirtilen ID ile eşleşen ürün bulunamadı",
        });
      }
    }
  });
});

// getting comments
app.get("/comments", authenticateToken, (req, res) => {
  fs.readFile("comments.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Yorumlar alınamadı" });
    } else {
      const comments = JSON.parse(data);

      const totalCount = comments.length;
      const totalRating = comments.reduce(
        (sum, comment) => sum + comment.rating,
        0
      );

      // avarage rating
      const averageRating = totalCount > 0 ? totalRating / totalCount : 0;

      res.json({ success: true, data: comments, totalCount, averageRating });
    }
  });
});

// adding comments to comment.json
app.post("/comments", authenticateToken, (req, res) => {
  const { commentRate, commentText } = req.body;

  if (!commentRate || commentRate <= 0) {
    res
      .status(422)
      .json({ success: false, message: "Rate value must be greater than 0." });
    return;
  }

  if (!commentText) {
    res
      .status(422)
      .json({ success: false, message: "You must write a comment." });
    return;
  }

  const newComment = {
    username: "user",
    comment: commentText,
    rating: commentRate,
    image: "https://picsum.photos/seed/picsum/400/300",
  };

  fs.readFile("comments.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Yorumlar alınamadı" });
    } else {
      const comments = JSON.parse(data);
      comments.unshift(newComment);

      fs.writeFile("comments.json", JSON.stringify(comments), "utf8", (err) => {
        if (err) {
          console.error(err);
          res
            .status(500)
            .json({ success: false, message: "Yorumlar güncellenemedi" });
        } else {
          res.json({ success: true, data: comments });
        }
      });
    }
  });
});

// run server
const port = 1556;
app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port}/ adresinde çalışıyor.`);
});
