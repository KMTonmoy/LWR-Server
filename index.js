const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://tonmoyahamed2009:tonmoytoma22@cluster0.w6nvtgn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const port = process.env.PORT || 9000;

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    credentials: true
}));
app.use(express.json());

async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const bannerCollection = client.db('LWR').collection('bannerCollection');
        const anouncementCollection = client.db('LWR').collection('Announcements');
        const usersCollection = client.db('LWR').collection('Users');
        const courseCollection = client.db('LWR').collection('courses');


        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        });

        // User endpoints
        app.get('/users', async (req, res) => {
            try {
                const users = await usersCollection.find().toArray();
                res.send(users);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: 'Failed to fetch users' });
            }
        });

        app.get('/users/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const result = await usersCollection.findOne({ email });
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: 'Failed to fetch user' });
            }
        });

        app.patch('/users/:email', async (req, res) => {
            const { email } = req.params;
            const { name, email: newEmail, profile } = req.body;
            const filter = { email };
            const updateDoc = {
                $set: {
                    name,
                    email: newEmail,
                    profile,
                },
            };
            try {
                const result = await usersCollection.updateOne(filter, updateDoc);
                if (result.matchedCount === 0) {
                    return res.status(404).send({ error: 'User not found' });
                }
                if (result.modifiedCount === 0) {
                    return res.status(400).send({ message: 'No changes made to the user' });
                }
                res.send({ message: 'User updated successfully' });
            } catch (error) {
                console.error('Error updating user:', error);
                res.status(500).send({ error: 'Failed to update user' });
            }
        });


        app.put('/user', async (req, res) => {
            try {
                const user = req.body;
                const query = { email: user?.email, name: user.displayName };
                const isExist = await usersCollection.findOne(query);

                if (isExist) {
                    if (user.status === 'Requested') {
                        const result = await usersCollection.updateOne(query, {
                            $set: { status: user?.status },
                        });
                        return res.send(result);
                    } else {
                        return res.send(isExist);
                    }
                }

                const options = { upsert: true };
                const updateDoc = {
                    $set: {
                        ...user,
                        timestamp: Date.now(),
                    },
                };
                const result = await usersCollection.updateOne(query, updateDoc, options);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: 'Failed to update user' });
            }
        });



        app.get('/banners', async (req, res) => {
            const banners = await bannerCollection.find().toArray();
            res.send(banners);
        });


        app.patch('/banners/:id', async (req, res) => {
            const bannerId = req.params.id;
            const { title, description, image } = req.body;

            const filter = { _id: new ObjectId(bannerId) };
            const updateDoc = {
                $set: {
                    title,
                    description,
                    image,
                },
            };

            try {
                const result = await bannerCollection.updateOne(filter, updateDoc);
                if (result.matchedCount === 0) {
                    return res.status(404).send({ error: 'Banner not found' });
                }
                res.send({ message: 'Banner updated successfully', result });
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: 'Failed to update banner' });
            }
        });

        app.delete('/banners/:id', async (req, res) => {
            const bannerId = req.params.id;
            const filter = { _id: new ObjectId(bannerId) };

            try {
                const result = await bannerCollection.deleteOne(filter);
                if (result.deletedCount === 0) {
                    return res.status(404).send({ error: 'Banner not found' });
                }
                res.send({ message: 'Banner deleted successfully', result });
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: 'Failed to delete banner' });
            }
        });


        // CourseS


        app.get('/course', async (req, res) => {
            const cursor = courseCollection.find();
            const result = await cursor.toArray();
            res.send(result);

        });

        app.get('/course/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await courseCollection.findOne(query);
            res.send(result);
        });

        app.post('/course', async (req, res) => {

            const newCourse = req.body;
            console.log(newCourse);
            const result = await courseCollection.insertOne(newCourse);
            res.send(result);

        });


        app.put('/course/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateCourse = req.body;
            const cours = {
                $set: {
                    image: updateCourse.image,
                    title: updateCourse.title,
                    description: updateCourse.description,
                    admission: updateCourse.admission,
                    startDate: updateCourse.startDate,
                    endDate: updateCourse.endDate,
                }
            }
            const result = await courseCollection.updateOne(filter, cours, options);
            res.send(result);
        })

        app.delete('/course/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await courseCollection.deleteOne(query);
            res.send({ deletedCount: result.deletedCount });

        });




        // Announcement
        app.get('/announcement', async (req, res) => {
            const users = await anouncementCollection.find().toArray();
            res.send(users);
        });

        app.patch('/announcements/:id', async (req, res) => {
            const { id } = req.params;
            const announce = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    status: announce.status
                },
            };
            try {
                const result = await anouncementCollection.updateOne(filter, updateDoc);
                if (result.matchedCount === 0) {
                    return res.status(404).send({ message: 'announce not found' });
                }
                res.send({ acknowledged: true });
            } catch (error) {
                console.error('Error updating announce:', error);
                res.status(500).send({ message: 'Failed to update announce' });
            }
        });

        app.post('/announcement', async (req, res) => {
            const announce = req.body;
            const result = await anouncementCollection.insertOne(announce);
            res.send(result);
        });



        // Logout endpoint
        app.get('/logout', async (req, res) => {
            try {
                res.clearCookie('token', {
                    maxAge: 0,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                }).send({ success: true });
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: 'Failed to logout user' });
            }
        });

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
    } finally {
        process.on('SIGINT', async () => {
            // await client.close();
            console.log("Disconnected from MongoDB!");
            // process.exit(0);
        });
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send(`LWR is running on Port ${port}`);
});
