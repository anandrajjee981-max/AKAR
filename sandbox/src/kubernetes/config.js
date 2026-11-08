import * as k8s from '@kubernetes/client-node';

let k8sApi, k8sNetworking, k8sDiscovery;
let k8sAvailable = false;

export function ensureK8s() {
  if (k8sAvailable && k8sApi) {
    return true;
  }
  try {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    const Currentcluster = kc.getCluster();
    if (Currentcluster?.server?.startsWith("https")) {
      Currentcluster.skipTLSVerify = true;
    }
    k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    k8sNetworking = kc.makeApiClient(k8s.NetworkingV1Api);
    k8sDiscovery = kc.makeApiClient(k8s.DiscoveryV1Api);
    k8sAvailable = true;
    console.log("Kubernetes client initialized successfully");
    return true;
  } catch (err) {
    console.warn("Kubernetes connection attempt failed:", err.message);
    k8sAvailable = false;
    return false;
  }
}

// Initial attempt at module load
ensureK8s();

export { k8sApi, k8sNetworking, k8sDiscovery };
export const isK8sAvailable = () => ensureK8s();
export { k8sAvailable };
