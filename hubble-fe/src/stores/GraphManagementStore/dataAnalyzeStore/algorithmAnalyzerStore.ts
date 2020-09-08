import { DataAnalyzeStore } from './dataAnalyzeStore';
import { observable, action } from 'mobx';
import { isEmpty } from 'lodash-es';
import isInt from 'validator/lib/isInt';

import {
  initializeRequestStatus,
  initializeErrorInfo,
  createShortestPathDefaultParams,
  createValidateShortestPathParamsErrorMessage,
  createLoopDetectionDefaultParams,
  createValidateLoopDetectionParamsErrorMessage,
  createFocusDetectionDefaultParams,
  createValidateFocusDetectionParamsErrorMessage
} from '../../factory/dataAnalyzeStore/algorithmStore';
import i18next from '../../../i18n';

import type { ShortestPathAlgorithmParams, LoopDetectionParams, FocusDetectionParams } from '../../types/GraphManagementStore/dataAnalyzeStore';

export class AlgorithmAnalyzerStore {
  dataAnalyzeStore: DataAnalyzeStore;

  constructor(dataAnalyzeStore: DataAnalyzeStore) {
    this.dataAnalyzeStore = dataAnalyzeStore;
  }

  @observable requestStatus = initializeRequestStatus();
  @observable errorInfo = initializeErrorInfo();

  @observable isCollapse = false;
  @observable currentAlgorithm = '';

  @observable
  shortestPathAlgorithmParams: ShortestPathAlgorithmParams = createShortestPathDefaultParams();

  @observable
  validateShortestPathParamsErrorMessage: ShortestPathAlgorithmParams = createValidateShortestPathParamsErrorMessage();

  @observable
  loopDetectionParams: LoopDetectionParams = createLoopDetectionDefaultParams();

  @observable
  validateLoopDetectionParamsErrorMessage: any = createValidateLoopDetectionParamsErrorMessage();

  @observable
  focusDetectionParams: FocusDetectionParams =  createFocusDetectionDefaultParams();

  @observable
  validateFocusDetectionParamsErrorMessage: any = createValidateFocusDetectionParamsErrorMessage();

  @action
  switchCollapse(flag: boolean) {
    this.isCollapse = flag;
  }

  @action
  changeCurrentAlgorithm(algorithm: string) {
    this.currentAlgorithm = algorithm;
  }

  @action
  mutateShortestPathParams<T extends keyof ShortestPathAlgorithmParams>(
    key: T,
    value: ShortestPathAlgorithmParams[T]
  ) {
    this.shortestPathAlgorithmParams[key] = value;
  }

  @action
  validateShortestPathParams<T extends keyof ShortestPathAlgorithmParams>(
    key: T
  ) {
    const value = this.shortestPathAlgorithmParams[key];

    switch (key) {
      case 'source':
      case 'target':
        if (isEmpty(value)) {
          this.validateShortestPathParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.no-empty'
          );

          return;
        }
        break;
      case 'max_depth':
        if (isEmpty(value)) {
          this.validateShortestPathParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.no-empty'
          );

          return;
        }

        if (!isInt(value, { min: 1 })) {
          this.validateShortestPathParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.postive-integer-only'
          );

          return;
        }

        break;
      case 'max_degree':
        if (!isInt(value, { min: 1 })) {
          this.validateShortestPathParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.postive-integer-only'
          );

          return;
        }

        break;
      case 'skip_degree':
        if (!isInt(value, { min: 0 })) {
          this.validateShortestPathParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.integer-only'
          );

          return;
        }

        break;
      case 'capacity':
        if (!isInt(value, { min: 1 })) {
          this.validateShortestPathParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.postive-integer-only'
          );

          return;
        }

        break;
    }

    this.validateShortestPathParamsErrorMessage[key] = '';
  }

  @action
  resetShortestPathParams() {
    this.shortestPathAlgorithmParams = createShortestPathDefaultParams();
  }

  @action
  mutateLoopDetectionParams<T extends keyof LoopDetectionParams>(
    key: T,
    value: LoopDetectionParams[T]
  ) {
    this.loopDetectionParams[key] = value;
  }

  @action
  validateLoopDetectionParams<T extends keyof LoopDetectionParams>(
    key: T
  ) {
    const value = this.loopDetectionParams[key];

    switch (key) {
      case 'source':
        if (isEmpty(value)) {
          this.validateLoopDetectionParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.no-empty'
          );

          return;
        }
        break;
      case 'max_depth':
        if (isEmpty(value)) {
          this.validateLoopDetectionParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.no-empty'
          );

          return;
        }

        if (!isInt(value, { min: 1 })) {
          this.validateLoopDetectionParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.postive-integer-only'
          );

          return;
        }

        break;
      case 'max_degree':
        if (!isInt(value, { min: 1 })) {
          this.validateLoopDetectionParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.postive-integer-only'
          );

          return;
        }

        break;
      case 'max_capacity':
        if (!isInt(value, { min: 0 })) {
          this.validateLoopDetectionParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.integer-only'
          );

          return;
        }

        break;
      case 'capacity':
        if (!isInt(value, { min: 1 })) {
          this.validateLoopDetectionParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.postive-integer-only'
          );

          return;
        }

        break;
    }

    this.validateLoopDetectionParamsErrorMessage[key] = '';
  }

  @action
  resetLoopDetectionParams() {
    this.loopDetectionParams = createLoopDetectionDefaultParams();
  }

  @action
  mutateFocusDetectionParams<T extends keyof FocusDetectionParams>(
    key: T,
    value: FocusDetectionParams[T]
  ) {
    this.focusDetectionParams[key] = value;
  }

  @action
  validateFocusDetectionParams<T extends keyof FocusDetectionParams>(
    key: T
  ) {
    const value = this.focusDetectionParams[key];

    switch (key) {
      case 'source':
        if (isEmpty(value)) {
          this.validateFocusDetectionParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.no-empty'
          );

          return;
        }
        break;
      case 'max_depth':
        if (isEmpty(value)) {
          this.validateFocusDetectionParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.no-empty'
          );

          return;
        }

        if (!isInt(value, { min: 1 })) {
          this.validateFocusDetectionParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.postive-integer-only'
          );

          return;
        }

        break;
      case 'max_degree':
        if (!isInt(value, { min: 1 })) {
          this.validateFocusDetectionParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.postive-integer-only'
          );

          return;
        }

        break;
      case 'max_capacity':
        if (!isInt(value, { min: 0 })) {
          this.validateFocusDetectionParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.integer-only'
          );

          return;
        }

        break;
      case 'capacity':
        if (!isInt(value, { min: 1 })) {
          this.validateFocusDetectionParamsErrorMessage[key] = i18next.t(
            'data-analyze.algorithm-forms.shortest-path.validations.postive-integer-only'
          );

          return;
        }

        break;
    }

    this.validateFocusDetectionParamsErrorMessage[key] = '';
  }

  @action
  resetFocusDetectionParams() {
    this.focusDetectionParams = createFocusDetectionDefaultParams();
  }

  @action
  dispose() {
    this.requestStatus = initializeRequestStatus();
    this.errorInfo = initializeErrorInfo();
    this.currentAlgorithm = '';
    this.shortestPathAlgorithmParams = createShortestPathDefaultParams();
    this.validateShortestPathParamsErrorMessage = createValidateShortestPathParamsErrorMessage();

    this.loopDetectionParams = createLoopDetectionDefaultParams();
    this.validateLoopDetectionParamsErrorMessage = createValidateLoopDetectionParamsErrorMessage();

    this.focusDetectionParams = createFocusDetectionDefaultParams();
    this.validateFocusDetectionParamsErrorMessage = createValidateFocusDetectionParamsErrorMessage();
  }
}
