const express = require("express");
const getTwitterMedia = require("get-twitter-media");
const bodyParser = require("body-parser");
const ejs = require("ejs"); // Tambahkan baris ini
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

app.set("view engine", "ejs"); // Tambahkan baris ini untuk mengatur mesin tampilan EJS
app.use(express.static("public")); // Tambahkan baris ini untuk mengizinkan penggunaan file statis (misalnya: CSS)

app.use(bodyParser.urlencoded({ extended: true }));

//import function getId from getId.js
const getId = require("./function/getId");
const { getThumbnail } = require("./function/getThumbnail");

app.get("/", (req, res) => {
  res.render("index"); // Mengubah ini untuk merender halaman EJS bernama 'index'
});

app.post("/", async (req, res) => {
  const { url } = req.body;

  //check if the url is valid
  if (!url) {
    return res.status(400).send("URL is required.");
  }

  if (!url.includes("twitter.com") && !url.includes("x.com")) {
    return res.status(400).send("URL is not from Twitter.");
  }

  const id = await getId(url);

  try {
    let media = await getTwitterMedia(url, {
      buffer: true,
    });
    var updatedMedia = {
      ...media,
      media: await Promise.all(
        media.media.map(async (item) => {
          const thumbnailResult = await getThumbnail(item.url, id);
          return {
            ...item,
            thumbnail: thumbnailResult.url,
            type: thumbnailResult.type,
          };
        })
      ),
    };

    console.log(updatedMedia);

    res.render("thumbnails", { media: updatedMedia.media }); // Render 'thumbnails' EJS template with updated media data
  } catch (error) {
    console.log("Gagal mendapatkan data dari URL:", url);
    console.error(error);
    res.render("404_production"); // Buat halaman EJS bernama 'error' untuk menampilkan pesan kesalahan
  }
});

app.get("/thumbnail/:name", (req, res) => {
  const { name } = req.params;
  const filePath = path.join(__dirname, "file", "thumbnail", name);
  console.log(filePath);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found.");
  }

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error sending file.");
    }
  });
});

app.use((req, res, next) => {
  if (req.method === "GET") {
    res.status(404).render("404_production");
  } else {
    res.status(404).json({
      code: 404,
      message: "Not Found",
    });
  }
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
