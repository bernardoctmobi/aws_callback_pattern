import { SFNClient, SendTaskSuccessCommand, SendTaskFailureCommand } from "@aws-sdk/client-sfn"
const client = new SFNClient({})

export const handler = async (event) => {
    const records = event.Records
    console.log(records)
    const promisesArray = records.map(record => createPromiseForRecord(record))
    const results = await Promise.allSettled(promisesArray)
    const batchItemFailures = results
        .filter(item => item.status === 'rejected')
        .map(item => ({ itemIdentifier: item.reason.message }))
    console.log(batchItemFailures)
    return { batchItemFailures }
}

async function createPromiseForRecord(record) {
    const parsedBody = JSON.parse(record.body)
    console.log(parsedBody)
    const result = (Number.isInteger(parsedBody.firstNumber) && (Number.isInteger(parsedBody.secondNumber)))

    if (!result) {
        const params = {
            taskToken: parsedBody.TaskToken,
            error: null,
            cause: JSON.stringify("Unexpected input")
        };
        console.log(params)
        const command = new SendTaskFailureCommand(params)
        const response = await client.send(command)
        console.log(response)
        throw new Error(record.messageId)
    }
    const params = {
        taskToken: parsedBody.TaskToken,
        output: JSON.stringify("Callback successful")
    };
    console.log(params)
    const command = new SendTaskSuccessCommand(params)
    console.log(`comando creato`)
    const response = await client.send(command)
    console.log(response)
    return (parsedBody.firstNumber + parsedBody.secondNumber)
}