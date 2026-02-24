function log(stage: string, data: Record<string, unknown>) {
    console.log(JSON.stringify({ stage, ...data, ts: Date.now() }));
}

export default log;
