#!/bin/bash

if [ "${PWD##*/}" == "delete" ]; then
    KUBECONFIG_FOLDER=${PWD}/../../kube-configs
elif [ "${PWD##*/}" == "scripts" ]; then
    KUBECONFIG_FOLDER=${PWD}/../kube-configs
else
    echo "Please run the script from 'scripts' or 'scripts/delete' folder"
	exit
fi

WITH_COUCHDB=false
PAID=false

Parse_Arguments() {
	while [ $# -gt 0 ]; do
		case $1 in
			--with-couchdb)
				echo "Configured to setup network with couchdb"
				WITH_COUCHDB=true
				;;
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

echo "Deleting blockchain services"
if [ "$(kubectl get svc | grep couchdb | wc -l | awk '{print $1}')" != "0" ]; then
    # Use the yaml file with couchdb
    echo "Running: kubectl delete -f ${KUBECONFIG_FOLDER}/blockchain-couchdb-services-${OFFERING}.yaml"
    kubectl delete -f ${KUBECONFIG_FOLDER}/blockchain-couchdb-services-${OFFERING}.yaml
else
    echo "Running: kubectl delete -f ${KUBECONFIG_FOLDER}/blockchain-services-${OFFERING}.yaml"
    kubectl delete -f ${KUBECONFIG_FOLDER}/blockchain-services-${OFFERING}.yaml
fi

echo "Deleting blockchain deployments"
if [ "$(kubectl get pods -a | grep couchdb | wc -l | awk '{print $1}')" != "0" ]; then
    # Use the yaml file with couchdb
    echo "Running: kubectl delete -f ${KUBECONFIG_FOLDER}/blockchain-couchdb.yaml"
    kubectl delete -f ${KUBECONFIG_FOLDER}/blockchain-couchdb.yaml
else
    echo "Running: kubectl delete -f ${KUBECONFIG_FOLDER}/blockchain.yaml"
    kubectl delete -f ${KUBECONFIG_FOLDER}/blockchain.yaml
fi

echo "Checking if all deployments are deleted"

NUM_PENDING=$(kubectl get deployments | grep blockchain | wc -l | awk '{print $1}')
while [ "${NUM_PENDING}" != "0" ]; do
	echo "Waiting for all blockchain deployments to be deleted. Remaining = ${NUM_PENDING}"
    NUM_PENDING=$(kubectl get deployments | grep blockchain | wc -l | awk '{print $1}')
	sleep 1;
done

NUM_PENDING=$(kubectl get svc | grep blockchain | wc -l | awk '{print $1}')
while [ "${NUM_PENDING}" != "0" ]; do
	echo "Waiting for all blockchain services to be deleted. Remaining = ${NUM_PENDING}"
    NUM_PENDING=$(kubectl get svc | grep blockchain | wc -l | awk '{print $1}')
	sleep 1;
done

while [ "$(kubectl get pods | grep utils | wc -l | awk '{print $1}')" != "0" ]; do
	echo "Waiting for util pod to be deleted."
	sleep 1;
done

echo "All blockchain deployments & services have been removed"
