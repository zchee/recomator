/* Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Home from "../views/Home.vue";
import Requirements from "../views/Requirements.vue";
import Projects from "../views/Projects.vue";
import store from "../store/root_store";
import { IRootStoreState } from "../store/root_state";
import { getBackendAddress } from "../config";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Home",
    component: Home,
    beforeEnter(_, __, next) {
      const token = (store.state as IRootStoreState).authStore!.idToken;
      // redirect to google sign in if we don't have a token
      if (token == undefined) {
        next({ name: "GoogleSignIn" });
        return;
      }

      const projectString = window.localStorage.getItem("project_list");
      if (projectString === null) {
        next("projects");
        return;
      } 

      store.dispatch("projectsStore/setSelected", JSON.parse(projectString));

      next();
    }
  },

  {
    // internal endpoint to redirect to Google sign-in
    // shuts the app down
    path: "/googleSignIn",
    name: "GoogleSignIn",
    beforeEnter() {
      window.location.href = `${getBackendAddress()}/redirect`;
    }
  },

  {
    // receive the authCode, exchange it for a token and finally
    // fetch recommendations and go to "/" with a saved token
    path: "/auth",
    name: "GetTokenAndGoHome",
    // nothing will be rendered until next() is called, so it is fine
    // that this function is asynchronous
    async beforeEnter(to, _, next) {
      const authCode = to.query.code;
      if (authCode == undefined) {
        next(new Error("The auth code is missing"));
        return;
      }

      // exchange the authCode for a token
      const response = await fetch(
        `${getBackendAddress()}/auth?code=${authCode}`
      );
      const responseCode = response.status;

      if (responseCode !== 200) {
        // we could redirect to Google sign-in instead, but
        // this would make it harder to track what fails
        // (the user would just sign in and then see the sign in page again)
        next(new Error("Failed to connect to the backend"));
        return;
      }

      // the request was successful, extract the token
      const responseJson = await response.json();
      const token = responseJson.token;

      store.commit("authStore/setIDToken", token);
      next({ name: "HomeWithInit" });
    }
  },
  {
    // Show the main page with recommendations, but initialize first
    path: "/homeWithInit",
    name: "HomeWithInit",
    beforeEnter(_, __, next) {
      // The following will return nearly immediately and work in the background:
      // Get recommendations from the backend
      store.dispatch("recommendationsStore/fetchRecommendations");
      // Start status watchers
      store.dispatch("recommendationsStore/startCentralStatusWatcher");

      next({ name: "Home" });
    }
  },

  {
    path: "/requirements",
    name: "Requirements",
    component: Requirements,
    beforeEnter(_, __, next) {
      // Asynchronously request and receive requirements from the middleware
      store.dispatch("requirementsStore/fetchRequirements");
      next();
    }
  },

  {
    path: "/projects",
    name: "Projects",
    component: Projects,
    beforeEnter(_, __, next) {
      // Asynchronously request and receive projects from the middleware
      store.dispatch("projectsStore/fetchProjects");
      
      next();
    }
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
