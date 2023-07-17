'use strict';
require('dotenv').config()

const N = 100
const topicNameOrId = 'coco-test';
const data = JSON.stringify({ foo: 'bar' });

// Imports the Google Cloud client library
const { PubSub } = require('@google-cloud/pubsub');
const { resolve } = require('path');

// Creates a client; cache this for further use

async function publishMessage(topicNameOrId, data) {
    const pubSubClient = new PubSub();
    // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
    const dataBuffer = Buffer.from(data);

    try {
        const messageId = await pubSubClient
            .topic(topicNameOrId)
            .publishMessage({ data: dataBuffer });
        console.log(`Message ${messageId} published.`);
    } catch (error) {
        console.error(`Received error while publishing: ${error.message}`);
        process.exitCode = 1;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const median = arr => {
    const mid = Math.floor(arr.length / 2),
        nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

async function publish(counter) {
    const result = {
        id: counter,
        t1: Date.now(),
        error: 0
    }
    await delay(Math.random() * 100)
    return new Promise(function (resolve, reject) {
        return publishMessage(topicNameOrId, data)
            .then(data => { result.t2 = Date.now() })
            .catch(err => { result.error = 1 })
            .then(r => resolve(result))
    });

}


async function run() {
    const all = []
    for (var i = 0; i < N; i++) all.push(publish(i))
    const r = await Promise.all(all)
    let results = r.reduce((acc, el) => { return acc.concat(el.t2 - el.t1) }, [])
    console.log("max (with outliers):", Math.max(...results))
    for(let i=0;i<N/10;i++) {
        let max = Math.max(...results)
        results=results.filter(it=>it!=max)
    }

    console.log("avg:", results.reduce((acc,it)=>acc+it, 0)/N)
    console.log("median:", median(results))
    console.log("max:", Math.max(...results))
    console.log("min:", Math.min(...results))
}

run(1)

