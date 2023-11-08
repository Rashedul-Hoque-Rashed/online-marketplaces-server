const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://localhost:5173',
'https://online-marketplace-67d40.web.app',
'https://online-marketplace-67d40.firebaseapp.com'
],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6r8tujw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next();
    })
}




async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const jobsCollections = client.db("jobsDB").collection('jobs');
        const bidsCollections = client.db("jobsDB").collection('bids');

        app.get("/api/v1/jobs", verifyToken, async (req, res) => {
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            else {
                const query = { buyerEmail: req.query.email };
                const result = await jobsCollections.find(query).toArray();
                res.send(result);
            }
        });

        app.get("/api/v1/jobs/:id", async (req, res) => {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await jobsCollections.findOne(query);
                res.send(result);
        });

        app.get("/api/v1/tab1", async (req, res) => {
            const query = { category: "web-development" };
            const result = await jobsCollections.find(query).toArray();
            res.send(result)
        });

        app.get("/api/v1/tab2", async (req, res) => {
            const query = { category: "digital-marketing" };
            const result = await jobsCollections.find(query).toArray();
            res.send(result)
        });

        app.get("/api/v1/tab3", async (req, res) => {
            const query = { category: "graphics-design" };
            const result = await jobsCollections.find(query).toArray();
            res.send(result)
        });

        app.post('/api/v1/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true });
        })

        app.post('/api/v1/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })

        app.post("/api/v1/jobs", async (req, res) => {
            const newJobs = req.body;
            const result = await jobsCollections.insertOne(newJobs);
            res.send(result);
        });

        app.put("/api/v1/update/:id", async (req, res) => {
            const id = req.params.id;
            const jobs = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateJobs = {
                $set: {
                    jobTitle: jobs.jobTitle,
                    deadline: jobs.deadline,
                    category: jobs.category,
                    minimumPrice: jobs.minimumPrice,
                    maximumPrice: jobs.maximumPrice,
                    description: jobs.description
                }
            }
            const result = await jobsCollections.updateOne(filter, updateJobs, options);
            res.send(result);
        })

        app.delete("/api/v1/jobs/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobsCollections.deleteOne(query);
            res.send(result);
        })

        app.get("/api/v1/bids", verifyToken, async (req, res) => {
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'forbidden access' })
            } else {
                const sortObj = {};
                const sortField = req.query.sortField;
                const sortOrder = req.query.sortOrder;
                if (sortField && sortOrder) {
                    sortObj[sortField] = sortOrder;
                }
                const query = { sellerEmail: req.query.email };
                const result = await bidsCollections.find(query).sort(sortObj).toArray();
                res.send(result);
            }
        })

        app.get("/api/v1/bids-request", verifyToken, async (req, res) => {
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'forbidden access' })
            } else {
                const query = { buyerEmail: req.query.email };
                const result = await bidsCollections.find(query).toArray();
                res.send(result);
            }
        })

        app.post("/api/v1/bids", async (req, res) => {
            const newBids = req.body;
            const result = await bidsCollections.insertOne(newBids);
            res.send(result);
        })

        app.put("/api/v1/bids-request/:id", async (req, res) => {
            const id = req.params.id;
            const bids = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateBids = {
                $set: {
                    status: bids.status,
                }
            }
            const result = await bidsCollections.updateOne(filter, updateBids, options);
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



app.get("/", (req, res) => {
    res.send('online-marketplace-server is running');
})


app.listen(port, () => {
    console.log(`online-marketplace-server is running on PORT: ${port}`)
})