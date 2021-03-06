import { showError } from "@/router/show_error";
/* Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the License);
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an AS IS BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import {
  RecommendationRaw,
  Impact,
  RecommendationContent,
  RecommendationStateInfo,
  getRecommendationCostPerWeek,
  getRecommendationProject,
  getRecommendationResourceShortName,
  getRecommendationType,
  ImpactList
} from "./recommendation_raw";

import { getInternalStatusMapping } from "./status_map";

// All data maintained for each recommendation, extends the raw object fetched from the API
export class RecommendationExtra implements RecommendationRaw {
  // These should not be modified (including inner fields) outside of tests:
  readonly name: string;
  readonly description: string;
  readonly recommenderSubtype: string;
  readonly primaryImpact: Impact;
  readonly content: RecommendationContent;
  readonly stateInfo: RecommendationStateInfo; // original status
  readonly additionalImpact?: ImpactList;

  // need to remember them so that v-data-table knows what to sort by
  readonly costCol: number = -123456789;
  readonly projectCol: string = "Undefined";
  readonly resourceCol: string = "Undefined";
  readonly typeCol: string = "Undefined";

  // These can be modified:
  statusCol = "Undefined"; // follows the current recommendation status, unlike stateInfo
  errorHeader?: string; // if apply fails,
  errorDescription?: string; // error details are stored here

  // decides if checkStatus requests are sent once in a while
  needsStatusWatcher = false;

  constructor(rec: RecommendationRaw) {
    this.name = rec.name;
    this.description = rec.description;
    this.recommenderSubtype = rec.recommenderSubtype;
    this.primaryImpact = rec.primaryImpact;
    this.content = rec.content;
    this.stateInfo = rec.stateInfo;
    this.additionalImpact = rec.additionalImpact;

    // let's make sure that even if we make an invalid assumption in
    // one of the parsers, we don't kill the app
    try {
      this.costCol = getRecommendationCostPerWeek(rec);
      this.projectCol = getRecommendationProject(rec);
      this.resourceCol = getRecommendationResourceShortName(rec);
      this.typeCol = getRecommendationType(rec);
      this.statusCol = getInternalStatusMapping(rec.stateInfo.state);
      this.needsStatusWatcher =
        this.statusCol === getInternalStatusMapping("CLAIMED");
    } catch (err) {
      showError(
        `Failed to parse recommendation: Continuing.`,
        {
          error: JSON.stringify(err),
          recommendation: JSON.stringify(rec)
        },
        false
      );
    }
  }
}
