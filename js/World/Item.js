import * as THREE from 'three';
import { Resources } from '../Util/Resources.js';

/**
 * 
 * The Item class is used for
 * defining items in our scene
 *
 **/
export class Item {

  // Natively, javascript does not support enums
  // We can make an enum-like object with the following
  // Object.freeze() makes the object immutable
  // Symbol() creates unique values for each type
  // Sample usage:
  // let item = new Item(Item.Type.Charger); 
  static Type = Object.freeze({
    Arrow: Symbol("arrow"),
    Chest: Symbol("chest"),
    Key: Symbol("key"),
    Shield: Symbol("shield"),
    Potion: Symbol("potion")
  });

  // To create an item to use in our scene
  constructor(type, resources) {

    // Radius used for testing if we are close to recycloBot
    this.radius = 3;

    // Set our type
    this.type = type;

    // Initialize base game object
    let geometry = new THREE.SphereGeometry(this.radius, 16, 16);
    let material = new THREE.MeshStandardMaterial({color: 'blue'});
    this.gameObject = new THREE.Mesh(geometry, material);
    
    // Initialize the game object
    switch (type) {
      case (Item.Type.Arrow):
        this.setModel(resources.get("arrow"), 0.6);
        this.gameObject.scale.set(5, 1.5, 3);
        this.gameObject.rotation.x = -67.5;
        break;
      case (Item.Type.Chest):
        this.setModel(resources.get("chest"), 1);
        this.gameObject.scale.set(2, 1.5, 2);
        this.gameObject.rotation.y = (-Math.PI / 2);
        this.radius = 7.5;
        break;
      case (Item.Type.Key):
        this.setModel(resources.get("key"), 7.5);
        this.gameObject.scale.set(2, 1.5, 2);
        this.gameObject.rotation.y = (-Math.PI / 2);
        break;
      case (Item.Type.Shield):
        this.setModel(resources.get("shield"), 20);
        this.gameObject.scale.set(1, 1, 1);
        this.gameObject.rotation.y = (-Math.PI / 4);
        this.radius = 7.5;
        break;
      case (Item.Type.Potion):
        this.setModel(resources.get("potion"), 10);
        this.radius = 7.5;
        break;
      default:
        console.log("Invalid item type: " + type);
    }
    
  }

    // Set a model for our character
    setModel(model, size) {
        let bbox = new THREE.Box3().setFromObject(model);

        // The depth of our object
        let dz = bbox.max.z - bbox.min.z;

        // Scale the object based on 
        // how large we want it to be
        let scale = size/dz;

        this.setModelScale(model, scale);

        this.gameObject = new THREE.Group();
        this.gameObject.add(model);
    }

    setModelScale(model, scale)
    {
        model.scale.set(scale, scale, scale);

        if (model.children.length != 0)
        {
        model.children.forEach(m => {
            this.setModelScale(m, scale);
        });
        }
    }
  
  // To set the location of our item
  setLocation(location) {
    this.location = location;
    this.gameObject.position.copy(this.location);
  }


}