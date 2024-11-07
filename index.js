const express = require('express')
const app = express();
const cors = require('cors')
const jwt = require('jsonwebtoken');

require('dotenv').config()

const port = process.env.PORT || 5000;


//middeleware
app.use(cors());
app.use(express.json());






const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.px2gaoj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const usersCollections = client.db('restaurent-e-commerce').collection('users')
    const menuCollections = client.db('restaurent-e-commerce').collection('menuCollection')
    const reviewCollections = client.db('restaurent-e-commerce').collection('reviews')
    const cartCollections = client.db('restaurent-e-commerce').collection('carts')

    // --------jwt API------
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      // console.log(token)
      res.send({ token })
    })

    // -------midddleWares-----

    const varifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorise access' })
      }

      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
      })
    }

    const varifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollections.findOne(query);
      isAdmin = user?.role === 'admin'
      if (!isAdmin) {
        return res.status(403).send({ message: 'unauthorize access' })
      }
      next();
    }



    // -----------Admin----------

    app.get('/users/admin/:email', varifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'unauthorise access' })
      }
      const query = { email: email }
      const user = await usersCollections.findOne(query)
      let admin = false;
      if (user) {
        admin = user?.role === 'admin'
      }

      res.send({ admin });
    })

    // -----------user----------


    app.get('/users', varifyToken, varifyAdmin, async (req, res) => {

      console.log(req.headers)

      const result = await usersCollections.find().toArray()
      res.send(result)
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existedUser = await usersCollections.findOne(query)
      if (existedUser) {
        return; res.send({ message: 'User already exist', insertedId: null })
      }
      const result = await usersCollections.insertOne(user)
      res.send(result)
    })

    app.delete('/users/:id', async (req, res) => {
      const id = req.params;
      const query = { _id: new ObjectId(id) }
      const result = await usersCollections.deleteOne(query)
      res.send(result)
    })

    // --------Admin API---------



    app.patch('/users/admin/:id', varifyAdmin, varifyToken, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollections.updateOne(query, updatedDoc)
      res.send(result)
    })


    // -------product/menu API-------


    app.get('/menu', async (req, res) => {
      const result = await menuCollections.find().toArray()
      res.send(result)
    })


    app.get('/menu/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const query = { _id: new ObjectId(id) }
      console.log(query)
      const result = await menuCollections.findOne(query)
      res.send(result)
    })

    app.post('/menu', varifyToken, varifyAdmin, async (req, res) => {
      const menuItem = req.body
      const result = await menuCollections.insertOne(menuItem)
      res.send(result)
    })

    app.patch('/menu/:id', async (req, res) => {
      const item=req.body;
      const id= req.params.id;
      const filter={_id: new ObjectId(id)}
      const updatedDoc=
      {
        $set:{
          name:item.name,
          category:item.category,
          price:item.price,
          recipe:item.recipe,
          image: item.image
        }
      }
      const result= await menuCollections.updateOne(filter,updatedDoc)
      res.send(result)
    })

    app.delete('/menu/:id', varifyToken, varifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await menuCollections.deleteOne(query);
      res.send(result);
    })



    // ------reviwews API-----

    app.get('/reviews', async (req, res) => {
      const result = await reviewCollections.find().toArray()
      res.send(result)
    })



    //  ------Carts------//

    app.get('/carts', varifyToken, async (req, res) => {
      const email = req.query.email
      const query = { email: email }
      const result = await cartCollections.find(query).toArray()
      res.send(result)
    })

    app.post('/carts', async (req, res) => {
      const cartItem = req.body
      const result = await cartCollections.insertOne(cartItem)
      res.send(result)
    })

    app.delete('/carts/:id', varifyAdmin, varifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await cartCollections.deleteOne(query);
      res.send(result);
    })







    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('server runnnningggg')
})

app.listen(port, () => {
  console.log(` restaurent server is running on ${port}`)
})