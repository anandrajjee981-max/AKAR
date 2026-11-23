import { Router } from "express";
import { createpod , waitForPodReady } from "../kubernetes/pod.js";
import { createservice} from "../kubernetes/service.js";
import { v4 as uuid } from "uuid";
import { ensureK8s } from "../kubernetes/config.js";
import { createSandboxTTL } from "../service/redis.js";
const router = Router();

router.get("/health", (req, res) => {  
    res.json({ message: "Sandbox API is healthy" });
});

router.post('sandbox/create', async(req,res)=>{
    if (!ensureK8s()) {
        return res.status(503).json({message: 'sandbox creation requires a running Kubernetes cluster'});
    }
    const sandboxid = uuidv4();
    const s3Bucket = `sandbox-${sandboxid}`;
    try{
        await createpod(sandboxid, s3Bucket);
        await createservice(sandboxid);

        // Wait for readiness best-effort; don't fail creation if it takes longer
        try { await waitForPodReady(`sandbox-pod-${sandboxid}`); } catch (e) { console.warn("pod not yet ready:", e.message); }
        try { await waitForServiceReachable(`sandbox-service-${sandboxid}`); } catch (e) { console.warn("service not yet reachable:", e.message); }
        try { await createSandboxTTL(sandboxid); } catch (e) { console.warn("failed to set sandbox TTL in redis:", e.message); }
        res.status(200).json({
            message: 'sandbox created successfully',
            "sandboxid": sandboxid ,
            "previewUrl": `http://${sandboxid}.preview.localhost`

        })
    }
    catch(err){
        res.status(500).json({message: 'sandbox creation failed', err: err?.message || String(err)})
    }
})



export default router;