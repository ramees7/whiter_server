const mongoose=require('mongoose')

const connectionString=process.env.MONGO_URI

mongoose.connect(connectionString).then((res)=>{
    console.log("MongoDB connected with Whiter Ecom");
}).catch((err)=>{
    console.log(err);
})