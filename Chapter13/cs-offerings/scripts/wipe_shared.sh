#!/bin/bash

# cp ../kube-configs/wipe_shared.yaml.base ../kube-configs/wipe_shared.yaml

if [ "$(kubectl get pvc | grep shared-pvc | wc -l | awk '{print $1}')" == "0" ] || [ "$(kubectl get pvc | grep composer-pvc | wc -l | awk '{print $1}')" == "0" ]; then
	echo "Error Persistent Volumes does not exist.. Cannot run wipeshared"
	exit 1
else
	kubectl create -f ../kube-configs/wipe_shared.yaml	
fi

while [ "$(kubectl get pod -a wipeshared | grep wipeshared | awk '{print $3}')" != "Completed" ]; do
    echo "Waiting for the shared folder to be erased"
    sleep 1;
done

kubectl delete -f ../kube-configs/wipe_shared.yaml
