<template>
  <v-dialog
    v-if="inside"
    :value="true"
    @dragover.prevent
  >
    <div
      class="absoluted"
      style="height: 100vh; width: 100%; display: flex"
      @drop="onDrop"
      @dragover.prevent
    >
      <v-container
        fill-height
        style="padding: 45px"
      >
        <v-fade-transition>
          <v-card
            style="height: 100%; width: 100%"
            :elevation="14"
          >
            <v-layout
              align-center
              justify-center
              row
              fill-height
            >
              <v-flex
                v-if="pending"
                style="text-align:center; user-select: none;"
              >
                <v-icon
                  :style="{ 'font-size' : `${50}px` }"
                  style="display: block"
                >
                  save_alt
                </v-icon>
                <v-card-text
                  class="headline font-weight-bold"
                  style="font-size: 100px"
                >
                  {{ $t('dropToImport') }}
                </v-card-text>

                <v-card-text class="font-weight-bold">
                  <v-icon>$vuetify.icons.forge</v-icon>
                  {{ $tc('mod.name', 0) }}
                  <v-icon>$vuetify.icons.fabric</v-icon>
                  Fabric
                  {{ $tc('mod.name', 0) }}
                  <v-icon>$vuetify.icons.zip</v-icon>
                  {{ $tc('resourcepack.name', 0) }}
                  <v-icon>$vuetify.icons.package</v-icon>
                  {{ $tc('save.name', 0) }}
                  <v-icon :size="16">$vuetify.icons.curseforge</v-icon>
                  {{ $tc('profile.modpack.name', 0) }}
                </v-card-text>
              </v-flex>
              <preview-view v-else :previews="previews" @cancel="cancel" />
            </v-layout>
          </v-card>
        </v-fade-transition>
      </v-container>
    </div>
  </v-dialog>
</template>

<script lang=ts>
import { useFileDrop } from '@/hooks';
import { required } from '@/util/props';
import { FileMetadata } from '@main/service/IOService';
import { Resource } from '@universal/entities/resource';
import { defineComponent, computed, ref } from '@vue/composition-api';
import { ResourceDomain, ResourceType } from '@universal/entities/resource.schema';
import PreviewView from './UniversalDropViewPreview.vue';

export interface FilePreview extends FileMetadata {
  name: string;
  size: number;
  enabled: boolean;
  status: 'loading' | 'idle' | 'failed' | 'saved';
}

export default defineComponent({
  components: {
    PreviewView,
  },
  setup() {
    const pending = ref(true);
    const inside = ref(false);
    const previews = ref([] as FilePreview[]);
    const { readFilesMetadata } = useFileDrop();
    async function onDrop(event: DragEvent) {
      const files = [] as Array<File>;
      const dataTransfer = event.dataTransfer!;
      if (dataTransfer.files.length > 0) {
        for (let i = 0; i < dataTransfer.files.length; i++) {
          const file = dataTransfer.files.item(i)!;
          if (previews.value.every(p => p.path !== file.path)) {
            files.push(file);
          }
        }
      }
      const result = await readFilesMetadata(files.map(f => ({ path: f.path })));
      for (let i = 0; i < result.length; i++) {
        const r = result[i];
        const f = files[i];
        previews.value.push({
          ...r,
          name: f.name,
          size: f.size,
          enabled: r.type !== ResourceType.Unknown,
          status: r.existed ? 'saved' : 'idle',
        });
      }
      pending.value = false;
    }
    function cancel() {
      pending.value = true;
      inside.value = false;
      previews.value = [];
    }
    document.addEventListener('dragleave', (e) => {
      if ((e as any).fromElement === null && e.dataTransfer!.effectAllowed === 'all') {
        if (!pending.value || previews.value.length > 0) {
          pending.value = false;
        } else {
          cancel();
        }
      }
    });
    document.addEventListener('dragenter', (e) => {
      if ((e as any).fromElement === null && e.dataTransfer!.effectAllowed === 'all') {
        inside.value = true;
        pending.value = true;
      }
    });
    return {
      onDrop,
      inside,
      pending,
      previews,
      cancel,
    };
  },
});
</script>
