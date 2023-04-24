
require('dotenv').config()
const express = require('express')
const File = require("./models/File")
const bcrypt = require('bcrypt')
const multer = require('multer')
const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE_URL)
const upload = multer({dest:"uploads"})
const app = express()
app.use(express.urlencoded({extended: true}))
app.set("view engine","ejs")
app.get("/",(req,res)=>{
    res.render("index")
})
app.post("/upload",upload.single("file"),async (req,res)=>{
    const FileData = {
        path: req.file.path,
        originalName: req.file.originalname
    }
    if(req.body.password != null && req.body.password != ""){
        FileData.password = await bcrypt.hash(req.body.password,10)
    }
    const file = await File.create(FileData)
    res.render("index",{fileLink:`${req.headers.origin}/file/${file.id}`})

})
app.get("/file/:id",async(req,res)=>{
    const file = await File.findById(req.params.id)
    if(file.password != null){
        if(req.body.password == null){
            res.render("password")
            return
        }
        if(!(await bcrypt.compare(req.body.password,file.password))){
            res.render("password",{error: true})
            return 
        }
    }
    file.downloadCount++
    await file.save()
    res.download(file.path,file.originalName)
})

app.get("/file/:id",handleDownload)
app.post("/file/:id",handleDownload)


async function handleDownload(req,res){
    const file = await File.findById(req.params.id)
    if(file.password != null){
        if(req.body.password == null){
            res.render("password")
            return
        }
        if(!(await bcrypt.compare(req.body.password,file.password))){
            res.render("password",{error: true})
            return 
        }
    }
    file.downloadCount++
    await file.save()
    res.download(file.path,file.originalName)
}
app.listen(5000,()=>{
    console.log("server started")
})
