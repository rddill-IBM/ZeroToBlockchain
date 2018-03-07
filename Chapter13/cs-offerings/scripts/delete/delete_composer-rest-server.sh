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

echo "Deleting Existing Composer Rest Server pod"
echo "Running: kubectl delete -f ../kube-configs/composer-rest-server.yaml"
kubectl delete -f ../kube-configs/composer-rest-server.yaml

while [ "$(kubectl get deployments | grep composer-rest-server | wc -l | awk '{print $1}')" != "0" ]; do
	echo "Waiting for composer rest server to be deleted"
	sleep 1;
done

echo "Deleting Existing Composer Rest Server services"
echo "Running: kubectl delete -f ${KUBECONFIG_FOLDER}/composer-rest-server-services-${OFFERING}.yaml"
kubectl delete -f ${KUBECONFIG_FOLDER}/composer-rest-server-services-${OFFERING}.yaml

while [ "$(kubectl get svc | grep composer-rest-server | wc -l | awk '{print $1}')" != "0" ]; do
	echo "Waiting for composer rest server to be deleted"
	sleep 1;
done

echo "Composer Rest Server deleted successfully"
