import Vue from 'vue'
import Vuex from 'vuex'
import { app, ipcMain } from 'electron';

import storeTemplate from 'universal/store'
import plugins from './plugins'

let isLoading = false;
let store;

const initer = [];
const loaders = [];

storeTemplate.plugins.push(...plugins);
Vue.use(Vuex);

/**
 * 
 * @param {Vuex.Module} mo 
 * @param {Array<string>} container 
 */
function discoverLoader(mo, path, container, initer) {
    if (mo.actions && mo.actions.load && mo.namespaced) {
        container.push([...path, 'load'].join('/'));
    }
    if (mo.actions && mo.actions.init && mo.namespaced) {
        initer.push([...path, 'init'].join('/'));
    }
    if (mo.modules) {
        Object.keys(mo.modules).forEach((k) => {
            discoverLoader(mo.modules[k], [...path, k], container, initer);
        })
    }
    return container;
}

discoverLoader(storeTemplate, [], loaders, initer);
/**
 * 
 * @param {string} root 
 * @returns {Promise<Vuex.Store>}
 */
async function load() {
    const root = app.getPath('userData');

    storeTemplate.state.root = root; // pre-setup the root
    isLoading = true;
    const newStore = new Vuex.Store(storeTemplate);

    // load
    await Promise.all(loaders.filter(action => newStore._actions[action] !== undefined)
        .map((action) => {
            console.log(`Found loading action [${action}]`)
            return newStore.dispatch(action).then((instance) => { console.log(`Loaded [${action}]`) },
                (err) => {
                    console.error(`An error occured when we load module [${action.substring(0, action.indexOf('/'))}].`)
                    console.error(err)
                })
        }));
    // init
    await Promise.all(initer.filter(action => newStore._actions[action] !== undefined)
        .map((action) => {
            console.log(`Found init action [${action}]`)
            return newStore.dispatch(action).then((instance) => {
                console.log(`Inited [${action}]`)
            }, (err) => {
                console.error(`An error occured when we init module [${action.substring(0, action.indexOf('/'))}].`)
                console.error(err);
            })
        }));
    isLoading = false;
    console.log('Done loading store!');

    /**
     * Force sync the root
     */
    newStore.commit('root', root);
    ipcMain.emit('store-ready', newStore);

    store = newStore;
}

ipcMain.on('reload', load);

export function commit(type, payload, option) {
    if (store === undefined) {
        console.error('shit');
        return;
    }
    store.commit(type, payload, option);
}

export function dispatch(type, payload, option) {
    if (store === undefined) {
        console.error('shit');
        return;
    }
    store.dispatch(type, payload, option);
}

export function loading() { return isLoading }
export function getStore() { return store; }