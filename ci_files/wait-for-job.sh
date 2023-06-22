#!/usr/bin/env bash

export job=$JOB_NAME
export ns="${NAMESPACE:-default}"

if [ -z $job ]; then
  echo JOB_NAME is required
  exit 1
fi

echo JOB_NAME = $job
echo NAMESPACE = $ns


kubectl get job -n $ns $job 
job_exists=$?

if [ $job_exists -ne 0 ]
then
  exit 1
fi

while true;
do
  echo "checking for success"
  kubectl wait --for=condition=complete -n $ns job/$job --timeout=0s >> /dev/null 2>&1
  success=$?
  if [ $success -eq 0 ]
  then
    exit 0;
  fi
  
  echo "checking for failure"
  kubectl wait --for=condition=failed -n $ns job/$job --timeout=0s >> /dev/null 2>&1
  fail=$?
  if [ $fail -eq 0 ]
  then
    exit 1
  fi
  
  sleep 5
done
