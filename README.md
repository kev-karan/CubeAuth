# CubeAuth 🧊🔐

A 3D Magic Cube screen locker and authentication interface for Linux, powered by LightDM and Three.js.

## 🚀 About the Project

CubeAuth transforms the traditional, monotonous Linux lock screen into an interactive 3D puzzle. Instead of simply typing a password, the user must solve a Rubik's Cube to unlock the session.

## 🛠️ Technologies Used

* **HTML/CSS/JavaScript (Vanilla):** Core structure and logic.
* **Three.js:** Native 3D rendering engine for the browser.
* **LightDM Web Greeter:** (Coming soon) Integration with the Linux login manager API.

## ✨ Current Features (Core 3D)

* **Dynamic Generation:** Supports the creation of cube matrices in different difficulties (2x2, 3x3, 4x4, etc.).
* **Robust 3D Navigation:** Implementation of **Cross Product** calculations to ensure that the rotation of the cube slices perfectly follows the mouse drag, regardless of the camera's angle or perspective.
* **Advanced Win Logic:** Utilization of **Quaternions** to calculate the global direction of the pieces' faces and validate if the cube is solved, regardless of its initial rotation state.
* **Physical Lighting:** Phong materials that react to a directional light to simulate a realistic polished plastic look.

## 🧪 How to Test the Prototype

For now, the project works autonomously in any modern web browser.

1. Clone this repository.
2. Open the `src/index.html` file in your web browser.
3. Click and drag the background to orbit the camera.
4. Click and drag a piece to rotate the slice.
5. Solve the cube to see the success message!
