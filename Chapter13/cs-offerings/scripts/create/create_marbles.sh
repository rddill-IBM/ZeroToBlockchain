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
				PAID=true
				;;
		esac
		shift
	done
}

Parse_Arguments $@

if [ "${PAID}" == "true" ]; then
	OFFERING="paid"
	PUBLIC_IP=$(kubectl get svc | grep marbles | awk '{print $3}' )
else
	OFFERING="free"
	PUBLIC_IP=$(bx cs workers blockchain | awk 'FNR==3{print $2}')
fi

echo "Creating marbles service"
echo "Running: kubectl create -f ${KUBECONFIG_FOLDER}/marbles-services-${OFFERING}.yaml"
kubectl create -f ${KUBECONFIG_FOLDER}/marbles-services-${OFFERING}.yaml

sleep 15

echo "Creating marbles pod"
echo "Running: kubectl create -f ${KUBECONFIG_FOLDER}/marbles.yaml"
kubectl create -f ${KUBECONFIG_FOLDER}/marbles.yaml

echo "Waiting for marbles to be up....."
sleep 30
echo "install and instantiate might take longer than expected"
echo "Please go to Marbles UI: http://${PUBLIC_IP}:32001 for next steps"
