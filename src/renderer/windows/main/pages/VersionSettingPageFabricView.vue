<template>
  <div style="display: flex !important; height: 100%; flex-direction: column;">
    <v-list-tile>
      <v-checkbox v-model="showStableOnly" :label="$t('fabric.showStableOnly')" />
    </v-list-tile>
    <v-divider dark />
    <v-layout v-if="fabricSupported">
      <v-flex xs6>
        <fabric-artifact-version-list
          :versions="yarnVersions"
          :version="yarn"
          :statuses="yarnStatus"
          :select="selectYarn"
        />
      </v-flex>
      <v-divider dark vertical />
      <v-flex xs6>
        <fabric-artifact-version-list
          :versions="loaderVersions"
          :version="loader"
          :statuses="loaderStatus"
          :select="selectLoader"
        />
      </v-flex>
    </v-layout>
    <hint
      v-else
      style="flex-grow: 1"
      icon="refresh"
      :text="$t('fabric.noVersion', { version: minecraft })"
    />
  </div>
</template>

<script lang=ts>
import { defineComponent, reactive, computed, toRefs } from '@vue/composition-api';
import {
  useFabricVersions,
} from '@/hooks';
import { required } from '@/util/props';
import { FabricArtifactVersion } from '@xmcl/installer/fabric';

export default defineComponent({
  props: {
    select: required<(v: { loader: string; yarn: string } | undefined) => void>(Function),
    filterText: required<string>(String),
    minecraft: required<string>(String),
    loader: required<string>(String),
    yarn: required<string>(String),
  },
  setup(props) {
    const data = reactive({
      showStableOnly: false,
    });

    const { yarnVersions: yv, loaderVersions: lv, yarnStatus, loaderStatus } = useFabricVersions();
    const loaderVersions = computed(() => lv.value.filter((v) => {
      if (data.showStableOnly && !v.stable) {
        return false;
      }
      return true;
      // return v.version.indexOf(filterText.value) !== -1;
    }));
    const yarnVersions = computed(() => yv.value.filter((v) => {
      if (v.gameVersion !== props.minecraft) {
        return false;
      }
      if (data.showStableOnly && !v.stable) {
        return false;
      }
      return true;
      // return v.version.indexOf(filterText.value) !== -1;
    }));
    const fabricSupported = computed(() => !!yarnVersions.value.find(v => v.gameVersion === props.minecraft));
    const selectYarn = (v: FabricArtifactVersion) => {
      if (!v.version) {
        props.select({ yarn: '', loader: '' });
      } else {
        props.select({ yarn: v.version, loader: props.loader ? props.loader : loaderVersions.value[0].version });
      }
    };
    const selectLoader = (v: FabricArtifactVersion) => {
      if (!v.version) {
        props.select({ yarn: '', loader: '' });
      } else {
        props.select({ yarn: props.yarn ? props.yarn : yarnVersions.value[0].version, loader: v.version });
      }
    };

    return {
      ...toRefs(data),
      selectLoader,
      selectYarn,
      yarnVersions,
      loaderVersions,
      fabricSupported,
      yarnStatus, 
      loaderStatus,
    };
  },
});
</script>

<style scoped=true>
.flex {
  padding: 6px 8px !important;
}
.subtitle {
  color: grey;
  font-size: 14px;
}
.version-tab {
  max-width: 100px;
  min-width: 100px;
}
</style>
<style>
.v-window__container {
  height: 100%;
}
</style>
