const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors")
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');


// Use Middleware 
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9adk4.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const servicesCollection = client.db("doctors-portal").collection("services")
        const bookingCollection = client.db("doctors-portal").collection("booking")
        const userCollection = client.db("doctors-portal").collection("user")

        // Get service

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)

        })
        // Available service
        app.get('/available', async (req, res) => {
            const date = req.query.date

            // step 1. get all service
            const services = await servicesCollection.find().toArray();

            // //step 2. get the booking of that day
            const query = { date: date };
            const booking = await bookingCollection.find().toArray();
            // // step 3. foreach service, finding booking of that day
            services.forEach(service => {
                const serviceBooking = booking.filter(b => b.treatment === service.name);
                const booked = serviceBooking.map(s => s.slot);
                const available = service.slots.filter(s => !booked.includes(s))
                service.slots = available;

            })
            res.send(services)
        })
        // Get Appointment

        app.get('/booking', async (req, res) => {
            const patient = req.query.patient;
            const query = { patient: patient };
            const booking = await bookingCollection.find(query).toArray();
            res.send(booking);
        })

        // Update User

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result)

        })


        // Post booking
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            const exist = await bookingCollection.findOne(query);
            if (exist) {
                return res.send({ success: false, booking: exist })
            }
            const result = await bookingCollection.insertOne(booking);
            return res.send({ success: true, result })
        })

    }
    finally {

    }
}
run().catch(console.dir)
app.get('/', (req, res) => {
    res.send('welcome doctors portal server')
});
app.listen(port, () => {
    console.log('Doctors portal is running');
})