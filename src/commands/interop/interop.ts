import { InteropedFeatures } from "./feature-module.ts";
import { dedupeDependencies, findDependency, PackageFileParsers } from "./parse-module.ts";
import { Installers } from "./installer-module.ts";
import { Generators } from "./pkggen-module.ts";
import { BareValidators } from "./validate-module.ts";

/**
 * Functions to help with interoperability.
 * @author ZakaHaceCosas
 */
export const FkNodeInterop = {
    PackageFileParsers,
    BareValidators,
    PackageFileUtils: {
        SpotDependency: findDependency,
        DedupeDependencies: dedupeDependencies,
    },
    Installers,
    Features: InteropedFeatures,
    Generators,
};
