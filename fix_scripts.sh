#!/bin/bash

# make scripts correct for osx/unix

declare -a chapters=('Chapter01' 'Chapter02' 'Chapter03' 'Chapter04' 'Chapter05' 'Chapter06' 'Chapter07' 'Chapter08' 'Chapter09' 'Chapter10' 'Chapter11' 'Chapter12')
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
