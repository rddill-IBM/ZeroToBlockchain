#!/bin/bash

if [ "${PWD##*/}" == "delete" ]; then
    KUBECONFIG_FOLDER=${PWD}/../../kube-configs
elif [ "${PWD##*/}" == "scripts" ]; then
    KUBECONFIG_FOLDER=${PWD}/../kube-configs
else
    echo "Please run the script from 'scripts' or 'scripts/delete' folder"
fi

PAID=false

Parse_Arguments() {
	while [ $# -gt 0 ]; do
		case $1 in
			--paid)
				echo "Configured to setup a paid storage on ibm-cs"
				PAID=true
				;;
		esac
		shift
	done
}

Parse_Arguments $@

if [ "${PAID}" == "true" ]; then
	OFFERING="paid"
else
	OFFERING="free"
fi

echo "Deleting composer-card-import pod"
echo "Running: kubectl delete -f ${KUBECONFIG_FOLDER}/composer-card-import.yaml"
kubectl delete -f ${KUBECONFIG_FOLDER}/composer-card-import.yaml

while [ "$(kubectl get svc | grep composer-card-import | wc -l | awk '{print $1}')" != "0" ]; do
	echo "Waiting for composer-card-import pod to be deleted"
	sleep 1;
done

echo "Deleting Composer Playground pod"
echo "Running: kubectl delete -f ${KUBECONFIG_FOLDER}/composer-playground.yaml"
kubectl delete -f ${KUBECONFIG_FOLDER}/composer-playground.yaml

while [ "$(kubectl get deployments | grep composer-playground | wc -l | awk '{print $1}')" != "0" ]; do
	echo "Waiting for composer-playground deployment to be deleted"
	sleep 1;
done

echo "Deleting Composer Playground services"
echo "Running: kubectl delete -f ${KUBECONFIG_FOLDER}/composer-playground-services-${OFFERING}.yaml"
kubectl delete -f ${KUBECONFIG_FOLDER}/composer-playground-services-${OFFERING}.yaml

while [ "$(kubectl get svc | grep composer-playground | wc -l | awk '{print $1}')" != "0" ]; do
	echo "Waiting for composer-playground service to be deleted"
	sleep 1;
done

echo "Composer Playground is deleted"
