export function gameUpdate(scope) {
  return function update(dt) {
    // dt is seconds, so animation speed does not depend on refresh rate.
    scope.state.elapsed += dt;

    for (const entity of Object.values(scope.state.entities)) {
      entity.update(dt);
    }
  };
}
