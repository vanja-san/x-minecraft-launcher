<template>
  <v-card style="overflow: auto; max-width: 100%; max-height: 70vh; min-height: 70vh">
    <v-container
      v-if="loading"
      fill-height
      style="min-height: 65vh;"
    >
      <v-layout
        justify-center
        align-center
        fill-height
      >
        <v-progress-circular
          indeterminate
          :size="100"
        />
      </v-layout>
    </v-container>
    <virtual-list
      v-else
      class="v-list"
      style="max-height: inherit; overflow-y: auto; transition: none"
      :data-component="Tile"
      :data-key="'id'"
      :data-sources="files"
      :estimate-size="56"
      :extra-props="{ getFileStatus: getFileStatus, install: install, download: download, modpack: type === 'modpacks' }"
    ></virtual-list>
    <v-dialog v-model="isConfirmDialogShown" persistent>
      <add-instance-stepper :show="isConfirmDialogShown" :initial-template="initialTemplate" @quit="isConfirmDialogShown = false" />
    </v-dialog>
  </v-card>
</template>

<script lang=ts>
import VirtualList from 'vue-virtual-scroll-list';
import { defineComponent, computed, inject, ref, reactive, toRefs } from '@vue/composition-api';
import { ProjectType } from '@universal/entities/curseforge';
import { File } from '@xmcl/curseforge';
import {
  useCurseforgeProjectFiles,
  useCurseforgeInstall,
} from '@/hooks';
import { required } from '@/util/props';
import Tile from './CurseforgeProjectPageFilesTile.vue';
import AddInstanceStepper from './InstancesPageAddInstanceStepper.vue';

export default defineComponent({
  components: { VirtualList, AddInstanceStepper },
  props: { project: required(Number), type: required<ProjectType>(String as any), from: String },
  setup(props) {
    const { files, loading, refresh } = useCurseforgeProjectFiles(props.project);
    const { install: installFile, getFileStatus, getFileResource } = useCurseforgeInstall(props.type, props.project);
    const text = inject('search-text', ref(''));
    const data = reactive({
      isConfirmDialogShown: false,
      initialTemplate: '',
    });
    async function install(file: File) {
      let stat = getFileStatus(file);
      if (props.type === 'modpacks') {
        let filePath: string;
        if (stat === 'remote') {
          const resource = await installFile(file);
          filePath = resource.path;
        } else {
          filePath = getFileResource(file).path;
        }
        data.initialTemplate = filePath;
        data.isConfirmDialogShown = true;
      } else {
        await installFile(file, props.from);
      }
    }
    async function download(file: File) {
      await installFile(file, props.from);
    }
    return {
      ...toRefs(data),
      Tile,
      files: computed(() => files.value.filter(f => f.displayName.indexOf(text.value) !== -1)),
      loading,
      refresh,
      getFileStatus,
      download,
      install,
    };
  },
});
</script>

<style>
.v-image__image {
  background-repeat: no-repeat;
  background-position: center center;
}
</style>
