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

echo "Creating Persistent Volumes"
if [ "${PAID}" == "true" ]; then
	if [ "$(kubectl get pvc | grep shared-pvc | awk '{ print $2 }')" != "Bound" ] || [ "$(kubectl get pvc | grep composer-pvc | awk '{ print $2 }')" != "Bound" ]; then
		echo "The paid PVC does not seem to exist"
		echo "Creating PVC named shared-pvc and composer-pvc"

		# making a PVC on ibm-cs paid version
		echo "Running: kubectl create -f ${KUBECONFIG_FOLDER}/storage-paid.yaml"
		kubectl create -f ${KUBECONFIG_FOLDER}/storage-paid.yaml
		sleep 5

		while [ "$(kubectl get pvc | grep shared-pvc | awk '{print $2 }')" != "Bound" ];
		do
			echo "Waiting for shared-pvc to be bound"
			sleep 5
		done

		while [ "$(kubectl get pvc | grep composer-pvc | awk '{print $2 }')" != "Bound" ];
		do
			echo "Waiting for composer-pvc to be bound"
			sleep 5
		done
	else
		echo "The PVC with name shared-pvc or composer-pvc exists, not creating again"
		#echo "Note: This can be a normal storage and not a ibm-cs storage, please check for more details"
	fi
else
	if [ "$(kubectl get pvc | grep shared-pvc | awk '{print $2}')" != "Bound" ]; then
		echo "The Persistant Volume does not seem to exist or is not bound"
		echo "Creating Persistant Volume"
		
		# making a pv on kubernetes
		echo "Running: kubectl create -f ${KUBECONFIG_FOLDER}/storage-free.yaml"
		kubectl create -f ${KUBECONFIG_FOLDER}/storage-free.yaml
		sleep 5
		if [ "kubectl get pvc | grep shared-pvc | awk '{print $3}'" != "shared-pv" ]; then
			echo "Success creating PV"
		else
			echo "Failed to create PV"
		fi
	else
		echo "The Persistant Volume exists, not creating again"
	fi

fi

