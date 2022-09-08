import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

 const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

app.get("/pastes/", async (req, res) => {
  const text = "select * from paste_list order by date desc limit 10";
  const dbres = await client.query(text);
  res.status(200).json(dbres.rows);
});

app.get<{id : string}>("/pastes/:id", async (req,res) => {
  const id = parseInt(req.params.id);
  const text = "select * from paste_list where id = $1"
  const selectedPaste = await client.query(text, [id])
  if (selectedPaste.rowCount === 1) {
    res.status(200).json(selectedPaste.rows)
  }
  else {
    res.status(400).json({
      status : "Fail"
    })
  }
})
app.post("/pastes/", async (req, res) => {
  const { content, title } = req.body;
  if (typeof content === "string"  && typeof title  === "string") {
    const values =  [title, content];
    const text = "insert into paste_list (title, content) values ($1,$2) returning *";
    const newPost = await client.query(text, values);
    res.status(200).json({ 
      status: "success",
      data : newPost
});
  }
  else if (typeof content === "string" ) {
    const values =  [content];
    const text = "insert into paste_list (content) values ($1) returning *";
    const newPost = await client.query(text, values);
    res.status(200).json({ 
      status: "success",
      data : newPost.rows
});
  }
  else {
    res.status(400).json ({
      status: "fail",
      message: "The content of paste has to be a string"
    })
  }
});

app.delete("/pastes/:pasteId", async (req,res) => {
  const pasteId = parseInt(req.params.pasteId)
  const text = 'delete from paste_list where id = $1 returning *'
  const deletedPaste = await client.query(text,[pasteId])
  if (deletedPaste.rowCount === 1) {
    res.status(200).json({
      status: 'success',
      data : deletedPaste.rows
    })
  }
  else {
    res.status(400).json({
      status : "fail",
      message : "no paste found with such id"
    })}
})
app.get ("/pastes/:pasteId/comments", async (req,res) => {
  const pasteId = parseInt(req.params.pasteId)
  const text = 'select * from comments where paste_id = $1 '
  const comments = await client.query(text,[pasteId])
  const paste = await client.query('select * from paste_list where id = $1', [pasteId])
  if (paste.rowCount === 1) {
    res.status(200).json (comments.rows)
  }
  else {
    res.status(404).json({
      status : "fail",
      message : "Paste could not be found"
    })
  }
})

app.post("/pastes/:pasteId/comments", async (req,res) => {
  const {username, comment} = req.body
  const pasteId = parseInt(req.params.pasteId)
  if (typeof comment === "string" && comment.length > 0) {
    const text = 'insert into comments (username, comment, paste_id) values ($1,$2,$3) returning *'
    const values = [username, comment, pasteId]
    const newPaste = await client.query(text,values)
    if (newPaste.rowCount === 1) {
      res.status(200).json ({
        status: "success",
        data : newPaste.rows
      })
    }
    else {
      res.status(404).json({
        status : "fail",
        message : "Paste could not be found"
      })
    }
  }
  else {
    res.status(400).json ({
      status: "fail",
      message: "The comment has to be a non-empty string "
    })
  }
})

app.delete("/pastes/:pasteId/comments/:commentId", async (req,res) => {
  const commentId = parseInt(req.params.commentId)
  const text = 'delete from comments where id = $1 returning *'
  const deletedComment = await client.query(text, [commentId])
  if (deletedComment.rowCount === 1) {
    res.status(200).json({
      status: 'success',
      data : deletedComment.rows
    })
  }
  else {
    res.status(400).json({
      status : "fail",
      message : "no comment with such id"
    })
  }

})
//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});

export default app
