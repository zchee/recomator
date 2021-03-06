<!-- Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. -->

<template>
  <v-app>
    <AppBar>
      <EditProjectsButton
        v-if="$store.state.recommendationsStore.progress === null"
      />
    </AppBar>
    <v-main>
      <ProgressWithHeader
        v-if="$store.state.recommendationsStore.progress !== null"
        :progress="$store.state.recommendationsStore.progress"
        header="Loading recommendations..."
        data-name="main_progress_bar"
      >
        <v-tooltip top transition="none">
          <template v-slot:activator="{ on }">
            <v-btn color="white" icon raised @click="cancelFetching" v-on="on">
              <v-icon>
                mdi-close-circle
              </v-icon>
            </v-btn>
          </template>
          Cancel loading recommendations
        </v-tooltip>
      </ProgressWithHeader>

      <v-container
        fluid
        data-name="main_container"
        v-if="$store.state.recommendationsStore.progress === null"
      >
        <PermissionDialog />
        <v-row>
          <v-col>
            <CoreTable />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    <Footer data-name="main-footer" />
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import AppBar from "@/components/AppBar.vue";
import CoreTable from "@/components/CoreTable.vue";
import EditProjectsButton from "@/components/EditProjectsButton.vue";
import Footer from "@/components/Footer.vue";
import PermissionDialog from "@/components/PermissionDialog.vue";

import ProgressWithHeader from "@/components/ProgressWithHeader.vue";
import { betterPush } from "./../router/better_push";

@Component({
  components: {
    CoreTable,
    EditProjectsButton,
    Footer,
    ProgressWithHeader,
    AppBar,
    PermissionDialog
  }
})
export default class Home extends Vue {
  cancelFetching() {
    this.$store.commit("recommendationsStore/setCancel", true);
    betterPush(this.$router, "ProjectsWithInit");
  }
}
</script>
