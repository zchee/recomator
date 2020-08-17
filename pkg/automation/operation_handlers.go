package automation

import (
	"errors"
	"math/rand"
	"time"

	"google.golang.org/api/recommender/v1"
)

// The type, that the value field of operation should be
// interpretable as in add snapshot operation
type valueAddSnapshot struct {
	Name             string
	SourceDisk       string
	StorageLocations []string
}

type gcloudOperation = recommender.GoogleCloudRecommenderV1Operation

// Assumes, that the operation's action is test and path is /machineType.
// Tests if the machine type is equal to operation's value, or matches the
// operation's value matcher.
func testMachineType(service GoogleService, operation *gcloudOperation) error {
	path := operation.Resource

	project, errProject := extractFromURL(path, projectParam)
	zone, errZone := extractFromURL(path, zoneParam)
	instance, errInstance := extractFromURL(path, instanceParam)
	err := chooseNotNil(errProject, errZone, errInstance)
	if err != nil {
		return err
	}

	result, err := TestMachineType(service, project, zone, instance, operation.Value, operation.ValueMatcher)
	if err != nil {
		return err
	}

	if result == false {
		return errors.New("machine type is not as expected")
	}

	return nil
}

// Assumes, that the operation's action is test and path is /status.
// Tests if the status is equal to operation's value, or matches the
// operation's value matcher.
func testStatus(service GoogleService, operation *gcloudOperation) error {
	path := operation.Resource

	project, errProject := extractFromURL(path, projectParam)
	zone, errZone := extractFromURL(path, zoneParam)
	instance, errInstance := extractFromURL(path, instanceParam)
	err := chooseNotNil(errProject, errZone, errInstance)
	if err != nil {
		return err
	}

	result, err := TestStatus(service, project, zone, instance, operation.Value, operation.ValueMatcher)
	if err != nil {
		return err
	}

	if result == false {
		return errors.New("status of instance is not as expected")
	}

	return nil
}

// Assumes, that the operation's action is replace and path is /machineType.
// Replaces the machine type with a new one.
func replaceMachineType(service GoogleService, operation *gcloudOperation) error {
	path1 := operation.Resource
	path2, ok := operation.Value.(string)
	if !ok {
		return errors.New("wrong value type for operation replace machine type")
	}

	project, errProject := extractFromURL(path1, projectParam)
	instance, errInstance := extractFromURL(path1, instanceParam)

	machineType, errMachine := extractFromURL(path2, machineTypeParam)
	zone, errZone := extractFromURL(path2, zoneParam)
	err := chooseNotNil(errProject, errInstance, errMachine, errZone)
	if err != nil {
		return err
	}

	err = service.StopInstance(project, zone, instance)
	if err != nil {
		return err
	}

	err = service.ChangeMachineType(project, zone, instance, machineType)
	if err != nil {
		return err
	}

	return service.StartInstance(project, zone, instance)
}

// Assumes that operation's action is replace, path is status and value
// is terminated. Stops the given machine.
func stopInstance(service GoogleService, operation *gcloudOperation) error {
	path := operation.Resource

	project, errProject := extractFromURL(path, projectParam)
	zone, errZone := extractFromURL(path, zoneParam)
	instance, errInstance := extractFromURL(path, instanceParam)
	err := chooseNotNil(errProject, errZone, errInstance)
	if err != nil {
		return err
	}

	return service.StopInstance(project, zone, instance)
}

// Assumes that operation's action is add, and ResourceType
// is compute.googleapis.com/Snapshot. Adds a snapshot of the given machine.
func addSnapshot(service GoogleService, operation *gcloudOperation) error {
	value, ok := operation.Value.(valueAddSnapshot)
	if !ok {
		return errors.New("wrong value type for operation add snapshot")
	}
	path := value.SourceDisk

	project, errProject := extractFromURL(path, projectParam)
	zone, errZone := extractFromURL(path, zoneParam)
	disk, errDisk := extractFromURL(path, diskParam)
	err := chooseNotNil(errProject, errZone, errDisk)
	if err != nil {
		return err
	}

	generator := rand.New(rand.NewSource(time.Now().UnixNano()))
	name, err := randomSnapshotName(zone, disk, generator)
	if err != nil {
		return err
	}

	return service.CreateSnapshot(project, zone, disk, name)
}

// Assumes that the operation's action is remove and its resource type
// is compute.googleapis.com/Disk. Removes the given disk.
func removeDisk(service GoogleService, operation *gcloudOperation) error {
	path := operation.Resource

	project, errProject := extractFromURL(path, projectParam)
	zone, errZone := extractFromURL(path, zoneParam)
	disk, errDisk := extractFromURL(path, diskParam)
	err := chooseNotNil(errProject, errZone, errDisk)
	if err != nil {
		return err
	}

	return service.DeleteDisk(project, zone, disk)
}
