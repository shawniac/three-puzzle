import { TweenObject } from 'client/lib/engine/game/TweenObject';
import { LayerDefintion } from 'client/lib/engine/layers';

export class GameObject extends TweenObject {
    constructor(options = {}) {
        super();
        this.name = options.name ? options.name : 'GameObject';

        this.isFrozen = options.frozen ? options.frozen : false;
        this.isSelectable = options.selectable ? options.selectable : true;

        // this.parentGameObject = null;
        // @todo: group wieder rausschmeißen, evtl doch ne THREE.group anlegen und kombinierte pieces da rein werfen...
        this.group = null;

        this.shadowMesh = null;
        this.selectMesh = null;
        if (options.shadowMesh) {
            this.shadowMesh = options.shadowMesh;
            this.shadowMesh.visible = false;
            this.shadowMesh.layers.set(LayerDefintion.IGNORE_RAYCAST);
            this.add(this.shadowMesh);
        }
        if (options.selectMesh) {
            this.selectMesh = options.selectMesh;
            this.selectMesh.visible = false;
            this.selectMesh.layers.set(LayerDefintion.IGNORE_RAYCAST);
            this.add(this.selectMesh);
        }
    }

    updateSelectState(selected) {
        if (this.selectMesh !== null) {
            this.selectMesh.visible = selected;
        }
    }

    updateShadowState(shadowActive) {
        if (this.shadowMesh !== null) {
            this.shadowMesh.visible = shadowActive;
        }
    }

    select() {
        this.updateSelectState(true);
        if (this.group === null) {
            return [this];
        }
        for(let i = 0; i < this.group.length; i++) {
            const gObj = this.group[i];
            gObj.updateSelectState(true);
        }
        return [...this.group]; // return as new array, so we're safe from mutation
    }

    unselect() {
        this.updateSelectState(false);
        // if (this.group === null) {
        //     return;
        // }
        // for(let i = 0; i < this.group; i++) {
        //     const gObj = this.group[i];
        //     gObj.updateSelectState(false);
        // }
        // return;
    }

    canBeSelected() {
        if (this.group !== null) {
            return this.getGroupLeader().isSelectable;
        }
        return this.isSelectable;
    }

    onPickUp(event) {
        this.updateShadowState(true);
    }

    onDrop(event) {
        this.updateShadowState(false);
    }

    updateGroup(newGroup) {
        this.group = newGroup;
    }

    sameGroup(otherObject) {
        if (this.group === null || otherObject.group === null) return false;
        return this.group === otherObject.group;
    }

    addGroup(otherObject) {
        // both have groups, combine them!
        if (this.group !== null && otherObject.group !== null) {
            if (this.sameGroup(otherObject)) return;

            const newGroup = this.group.concat(otherObject.group);
            newGroup.forEach(obj => {
                obj.updateGroup(newGroup);
            });
            return;
        }
        // we have no group
        if (this.group === null) {
            // other has no group either, create a new one
            if (otherObject.group === null) {
                this.group = [this, otherObject];
                otherObject.updateGroup(this.group);
            } else { // other has group, use theirs and add ourself
                this.group = otherObject.group;
                this.group.push(this);
            }
        } else { // we have a group, other has not, use our group and send to other
            this.group.push(otherObject);
            otherObject.updateGroup(this.group);
        }
        console.log(this.group);
    }

    removeFromGroup() {
        if (this.group === null) return;
        for (let i = 0; i < this.group.length; i++) {
            const gObj = this.group[i];
            if (gObj === this) {
                this.group.splice(i, 1);
                this.group = null;
                return;
            }
        }
    }

    getGroupLeader() {
        return this.group !== null && this.group.length > 0 ? this.group[0] : this;
    }

    isGroupLeader() {
        return this.getGroupLeader() === this;
    }
}
