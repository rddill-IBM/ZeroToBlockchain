#!/bin/bash

# make scripts correct for osx/unix

declare -a chapters=($(ls -d -- */))
echo "${chapters[@]}"
dos2unix `ls *.sh`
for i in "${chapters[@]}"
do
    echo "changing to ${i}"
    cd "${i}"
    pwd
    dos2unix buildAndDeploy
    testRes=`ls *.sh`
    if [[ "${testRes}" != "" ]]; then
        echo " updating files"
        dos2unix `ls *.sh`
    else
        echo 'no files to update'
    fi
   cd ../
done
