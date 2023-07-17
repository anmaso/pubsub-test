'use strict';
require('dotenv').config()

console.log(process.env.GOOGLE_CLOUD_PROJECT)

const N = 1000
const topicNameOrId = 'coco-test';
const data = JSON.stringify({ foo: 'bar' });

// Imports the Google Cloud client library
const { PubSub } = require('@google-cloud/pubsub');
const { resolve } = require('path');

// Creates a client; cache this for further use
//
function histogram(data) {
    // find the range of the data
    let min = Math.min(...data);
    let max = Math.max(...data);

    // divide the range into 10 bins
    let binSize = (max - min) / 10;
    let histogram = [];

    // initialize histogram with ranges and count
    for (let i = 0; i < 10; i++) {
        histogram.push({ range: [min + i*binSize, min + (i+1)*binSize], count: 0 });
    }

    // for each number, find its bin and increment the count
    for (let num of data) {
        let bin = Math.floor((num - min) / binSize);
        // if a number is exactly equal to the max, it should go in the last bin
        bin = bin == 10 ? 9 : bin;
        histogram[bin].count++;
    }

    // return the histogram
    return histogram;
}

function printHistogram(data) {
    let histData = histogram(data);
    let counts = histData.map(it=>it.count);
    let max = Math.max(...counts)
    
    let pad6 = (el)=>(""+el).padEnd(6)

    histData.forEach(bin => {
        let bar = "█".repeat(20*bin.count/max);
	let n = (""+bin.count).padEnd(4)
	let r = [pad6(bin.range[0].toFixed(2)),  pad6(bin.range[1].toFixed(2))]
        console.log(`${r[0]}, ${r[1]}: ${n}: ${bar}`);
    });
}

const pubSubClient = new PubSub();
async function publishMessage(topicNameOrId, data) {
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

const micro = ()=>{
	let hrTime = process.hrtime()
	return hrTime[0] * 1000000 + hrTime[1] / 1000
}

async function publish(counter) {
    await delay(Math.random() * 10000)
    const result = {
        id: counter,
        t1: Date.now(),
        error: 0
    }
    return new Promise(function (resolve, reject) {
        return publishMessage(topicNameOrId, data)
            .then(data => { result.t2 = Date.now() })
            .catch(err => { console.log("ERROR"); result.error = 1 })
            .then(r => resolve(result))
    });

}


async function run() {
    const all = []
    for (var i = 0; i < N; i++) all.push(publish(i))
    const r = await Promise.allSettled(all)
    let results = r.reduce((acc, el) => { return acc.concat(el.value.t2 - el.value.t1) }, [])
	console.log("len:", results.length)
    console.log("max (with outliers):", Math.max(...results))
    for(let i=0;i<N/30;i++) {
        let max = Math.max(...results)
        results=results.filter(it=>it!=max)
    }
	console.log("len:", results.length)

	    console.log("avg:", results.reduce((acc,it)=>acc+it, 0)/(results.length))
    console.log("median:", median(results))
    console.log("max:", Math.max(...results))
    console.log("min:", Math.min(...results))
	printHistogram(results)
}

run(1)

