export function gameUpdate(scope) {
  return function update(dt) {
    const state = scope.state;

    // dt is seconds, so animation speed does not depend on refresh rate.
    state.elapsed += dt;

    for (const entity of Object.values(state.entities)) {
      entity.update(dt, (event) => scope.emitEvent(event));
    }

    let e = state.events.shift();
    while (e) {
      console.log("Oh look:", e);
      e = state.events.shift();
    }
  };
}
