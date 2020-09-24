/*
Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main

import "github.com/gin-gonic/gin"

func setUpRouter(service *SharedService) *gin.Engine {
	router := gin.Default()
	router.Use(corsMiddleware())

	router.GET("/redirect", redirectHandler)

	router.GET("/auth", getAuthHandler(service))

	router.GET("/projects", getProjectsHandler(service))

	router.POST("/requirements", getStartCheckingHandler(service))

	router.GET("/requirements", getCheckRequirementsHandler(service))

	router.POST("/recommendations", getStartListingHandler(service))

	router.GET("/recommendations", getListHandler(service))

	router.POST("/recommendations/apply", getApplyHandler(service))

	router.GET("/recommendations/checkStatus", getCheckStatusHandler(service))
	return router
}

// SharedService is the struct that contains authorization service
// and information about currently processed requests.
type SharedService struct {
	auth     AuthorizationService
	requests RequestsMap
}

// NewSharedService creates new sharedService to access GoogleAPIs.
func NewSharedService() (*SharedService, error) {
	var service SharedService
	auth, err := NewAuthorizationService()
	if err != nil {
		return nil, err
	}
	service.auth = auth
	service.requests = NewRequestsMap()
	return &service, nil
}
