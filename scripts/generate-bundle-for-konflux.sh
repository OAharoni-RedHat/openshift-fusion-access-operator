#!/usr/bin/env bash

# Source the environment values that contain the component image pullspecs coming from the  nudges
for file in nudges/*.imagePullSpec.yaml
do $(cat $file | tail -n+2 )
done

# Expose the operator's version as an env variable to be used when building the operator-sdk's bundle
# manifests and also in the bundle.konflux.Dockerfile's label
export VERSION=$(cat VERSION.txt)

# Run the bundle generation flow, including replacing the image pullspecs in the config templates
# to the ones from the nudges with the 'envsubst' command
kustomize build config/manifests/ | \
envsubst | \
operator-sdk generate bundle \
        -q \
        --overwrite \
        --version $VERSION \
        --output-dir bundle \
        --channels development \
        --default-channel development \
        --use-image-digests
operator-sdk bundle validate ./bundle

# Generate the bundle.konflux.Dockerfile with the label values for the components that
# are used as references in the bundle replaced by the actual values from the env values
# using the 'envsubst' command.
# These labels are used in the release process to validate that the bundle related image pullspecs
# match with the Snapshot component pullspecs.
cat templates/bundle.konflux.Dockerfile.template | envsubst >bundle.konflux.Dockerfile