#!/bin/bash

if [ "${PWD##*/}" == "create" ]; then
    KUBECONFIG_FOLDER=${PWD}/../../kube-configs
elif [ "${PWD##*/}" == "scripts" ]; then
    KUBECONFIG_FOLDER=${PWD}/../kube-configs
else
    echo "Please run the script from 'scripts' or 'scripts/create' folder"
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

echo "Creating composer-card-import pod"
echo "Running: kubectl create -f ${KUBECONFIG_FOLDER}/composer-card-import.yaml"
kubectl create -f ${KUBECONFIG_FOLDER}/composer-card-import.yaml

while [ "$(kubectl get pod -a composer-card-import | grep composer-card-import | awk '{print $3}')" != "Completed" ]; do
    echo "Waiting for composer-card-import container to be Completed"
    sleep 1;
done

if [ "$(kubectl get pod -a composer-card-import | grep composer-card-import | awk '{print $3}')" == "Completed" ]; then
	echo "Composer Card Import Completed Successfully"
fi

if [ "$(kubectl get pod -a composer-card-import | grep composer-card-import | awk '{print $3}')" != "Completed" ]; then
	echo "Composer Card Import Failed"
fi

echo "Deleting composer-card-import pod"
echo "Running: kubectl delete -f ${KUBECONFIG_FOLDER}/composer-card-import.yaml"
kubectl delete -f ${KUBECONFIG_FOLDER}/composer-card-import.yaml

while [ "$(kubectl get svc | grep composer-card-import | wc -l | awk '{print $1}')" != "0" ]; do
	echo "Waiting for composer-card-import pod to be deleted"
	sleep 1;
done

echo "Creating composer-playground deployment"
echo "Running: kubectl create -f ${KUBECONFIG_FOLDER}/composer-playground.yaml"
kubectl create -f ${KUBECONFIG_FOLDER}/composer-playground.yaml

if [ "$(kubectl get svc | grep composer-playground | wc -l | awk '{print $1}')" == "0" ]; then
    echo "Creating composer-playground service"
    echo "Running: kubectl create -f ${KUBECONFIG_FOLDER}/composer-playground-${OFFERING}.yaml"
    kubectl create -f ${KUBECONFIG_FOLDER}/composer-playground-services-${OFFERING}.yaml
fi

echo "Checking if all deployments are ready"

NUMPENDING=$(kubectl get deployments | grep composer-playground | awk '{print $5}' | grep 0 | wc -l | awk '{print $1}')
while [ "${NUMPENDING}" != "0" ]; do
    echo "Waiting on pending deployments. Deployments pending = ${NUMPENDING}"
    NUMPENDING=$(kubectl get deployments | grep composer-playground | awk '{print $5}' | grep 0 | wc -l | awk '{print $1}')
done

echo "Composer playground created successfully"
