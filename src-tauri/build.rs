use std::{env, fs, path::PathBuf};

// Small embedded LexiGlass icon used by tauri-build. The ICO contains a PNG
// payload, so the build script can materialize both formats on a fresh clone.
const ICON_HEX: &str = "0000010001002020000000002000030600001600000089504e470d0a1a0a0000000d4948445200000020000000200806000000737a7af4000005ca49444154789ced975d6c5c4715c7ffff997bf7ee97edddb5d7c62951d2381f2509910df9a81a2b42d012d146c04b42ab126804a23cc0037de80ba8224aa03c543ca1b6202820a58a4245ab56aa40aa5491342a6a499ab4416ebbfe48154393d8ebbbeb4dbc7b77ef9d393cd86b92789dd885bef52fcdcbfd98f99d7366ce9cc3de95b70b5a88a4906cf56ad912118848cbc99c160b0380848d06a3b0016989b7741180765dc43c6f1e6651009230c6206cd479dbeabe2bebfbfb27b3f9eeaa584b82cb42110895525229f9f1e173ef745e28bc9f555ac389c544ac9df7069b212089280ae1c513e1fe471e3dbb69db8e62e1ed3399e2a58b6da422b05c57102256329d9d3377f47fbe347e7eb4fd99c70f0d4c4f4d255ccf9b8760efcadb65ce7289795ef493a77f77727cf87df7cfbff9f5967ab5eabbae2e68ea9a4096ec85e6b716361686519f8ec556dcb3f781a19d5fb9b7fcd3efec1f2c158b49d77545443807a024a8cdf0e1c70e9dd64ad79e79fcf0d64faf5af5f2a77a7bcefa7e699d312645d052292a051863007b33e32902514a31c866b3c3a55279f5072323fbf67cebc0d0fa8181e0173ffcfea0e3c604227448ca6cccd75cddbcfdce899f7defc0cedb56ad7cb93d9dbe50280c3f22804b812845d482404c68904c2549627683128b4787c054d1475777e7b1bef5eb8ebef2dcb1fbb7dfb3fbe41dfd9f9b1c3af58fbc974c8a2289280cb1a17f60a270f64c26a8d6fcdededeb3ffbaf8e14324eb5aa9b27674250882e90d1b37d6eefae217ea4aab8a5899d68eae28a52a4a2f32949a565a5526278a0fa6dbda3e5494d133278ef76cdab6fd92310604a080d9a391cd77578b972fb6b9ae5bf0fdd23a015c9291a2d23357ae72f7d7be9efee51ffed8f3f3279fcc3f7ae870a7403404ea1643031082e154d1df92f0e2eff91397d2d9aeeea09963d4fcc6b10292d464d544264541d3c12089bbefbb2fe9791eca7e093b76ed8aaf5cb3c609829a50a985ae5f10088ab53605cd8024acfc7703b5fa9b379e399208a308c61828a5d0683440de72e11b2568910d973c8b229b5912ffaf14bd2c808f4b9f007c02b0a01e58aa94d6d05a433b1a62af3f1502c046e6e305b8325db6a5e2948da7025a7bcdcd24168ee332d5d6c6a554331f1960effe6fa7cba529ab1d17cd850402d789616c64383afed7bfd45c3776cb84b164007b83355fbdff1b29a5afcf99825916d7059e4826f9e2d1a3336d1dedb466f1702c094044e0ba0e81d95a404450f6fdf9dbf85a4551847c4f37b76cdb1a7fe1c891995b65cd560022d7ceab086badbcf1dac9dad6bbee743bb2d9662a5e38f31c913106afbffa6a4d3b0eaf29426f5e155311620516f094a63f0721363248a5d3eaf9678f5c1d3f7f3eea59b142455104b65c5fe03a0e3e181d35ef9c3e554fa5d3b4d65a4008a5ea10b8622d9552721d0001544a7e7cede6cf4e8561a32f9bcdbe3155f467ed212c04f4621efe7efc6f551346b3f7e56212811373914ca694402c402b102f97cd9e1b2b4e7ea93d97ab564a7ebce9194744a05d1785736fe7f77cf3a1111d8b6d2af9e5d55ddd9dc726278a0f920c21b4a030994ab7b47c2183c0182b002830f14c26f392358d4414451bfb0777bdfea7a77eb5592905990360ccf3e442a1d071616ca463f7de07869effedd3fbfad66f38dad7b7f609bf58dc1259932678b332b49508c57a2e9b3b179946e2dd7f0e1d18bc77cf180967e8d49b3d5e2201b1b6591553a230647b2e573bf8fb675f3bf1d20bb9579e3bf6194246935efc3d9001d8bab55adc0d14026ead5e5f1b45d1c61d777f796cdf0f7e347ef0bbfb77fefbfc5847cc8b8bc81c0000502984f53ab25df9eac3070f9fce74e6ab674e1ceff12f5f6ca3d2f2911a136bd89ecbcdf40feeba4cc279eab11f0f8c8f8d66bc44e2fac664fe17a5246a3428106ce81f98d8b475c74426df5d832cd7fbb35254a8947defddb7deea1a3af5666f1486f4e271b1ad5ab3f9072444048d208031e67f2ebf44044a2978890448ca8d5df28244d43c1e5e32b9cca0df04028058cb562dfa7f00669ccd05acd54a350000000049454e44ae426082";

fn decode_hex(input: &str) -> Vec<u8> {
    assert!(input.len() % 2 == 0, "embedded icon hex must be even-length");
    (0..input.len())
        .step_by(2)
        .map(|index| u8::from_str_radix(&input[index..index + 2], 16).expect("invalid embedded icon hex"))
        .collect()
}

fn main() {
    let icon_bytes = decode_hex(ICON_HEX);

    // `tauri::generate_context!()` resolves the default application icon at
    // compile time, so make sure icons/icon.png exists before the crate builds.
    // An ICO with a single PNG frame has a 22-byte ICO header + directory entry.
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR is required"));
    let icons_dir = manifest_dir.join("icons");
    fs::create_dir_all(&icons_dir).expect("failed to create Tauri icons directory");
    fs::write(icons_dir.join("icon.png"), &icon_bytes[22..])
        .expect("failed to materialize embedded PNG icon");

    if env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("windows") {
        let icon_path = PathBuf::from(env::var("OUT_DIR").expect("OUT_DIR is required"))
            .join("lexiglass.ico");
        fs::write(&icon_path, &icon_bytes).expect("failed to materialize embedded Windows icon");

        let attributes = tauri_build::Attributes::new().windows_attributes(
            tauri_build::WindowsAttributes::new().window_icon_path(icon_path),
        );
        tauri_build::try_build(attributes).expect("failed to run tauri-build");
    } else {
        tauri_build::build();
    }
}
