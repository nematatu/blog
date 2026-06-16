let pixels = repeat([0xff,0x00,0x00], 4*4)->list2blob()
call popup_create('', #{image: #{ data: pixels, width: 4, height: 4 }, line: 'cursor+1', col: 'cursor'})
